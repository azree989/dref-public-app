import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {preparePublication,fetchJson,sync} from './sync.mjs';
import {heartbeat} from './heartbeat.mjs';
import {productionBranch} from './project.mjs';
import {writeRelease} from './release.mjs';
import {fields,validatePayload,createSearch} from '../site/formulary-logic.js';
import {readSavedFormulary,saveFormulary,loadPublishedFormulary,sameSnapshot} from '../site/formulary-data.js';
const sourceId='1fAsbBG43d7sg376Lv5KIjWychJTqYdHLDsy_8DyllqU';
const record=(name='Medicine')=>Object.fromEntries(fields.map(f=>[f,f==='genericName'?name:f==='dosage'?'5 mg daily':'']));
const payload={schemaVersion:1,sourceId,records:[record('Amlodipine 5 mg Tablet'),record('Metformin 500 mg Tablet')],notice:'Pharmacy notice',fetchedAt:'2026-10-12T07:00:00.000Z'};
const previous=validatePayload(payload),newTime={...payload,fetchedAt:'2026-10-13T07:00:00.000Z'};
assert(sameSnapshot(previous,validatePayload(newTime)));
assert.equal(preparePublication(newTime,previous,{sourceSheetId:sourceId}).fetchedAt,payload.fetchedAt);
assert.throws(()=>preparePublication({...payload,sourceId:'wrong'},previous,{sourceSheetId:sourceId}));
assert.throws(()=>preparePublication({...payload,records:[]},previous));
assert.throws(()=>preparePublication({...payload,records:[record()]},previous));
assert.equal(preparePublication({...payload,records:[record()]},previous,{allowLargeChange:true}).records.length,1);
assert.throws(()=>preparePublication({...payload,records:[{...record(),dosage:42}]},previous));
const changed={...newTime,records:[{...record('Amlodipine 5 mg Tablet'),dosage:'Reviewed source dose'},record('Metformin 500 mg Tablet')]};
assert.equal(preparePublication(changed,previous).records[0].dosage,'Reviewed source dose');
assert.equal(preparePublication(changed,previous).fetchedAt,newTime.fetchedAt);
const memory=new Map(),storage={getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)};
assert.equal(readSavedFormulary(storage),null);assert(saveFormulary(payload,storage));
assert.equal(createSearch(readSavedFormulary(storage).records)('Metformin').items[0].genericName,'Metformin 500 mg Tablet');
assert.equal(saveFormulary(payload,{setItem(){throw Error('quota');}}),false);
assert.equal(readSavedFormulary({getItem:()=>'<html>sign in</html>'}),null);
const json=(value,extra={})=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json',...extra}});
const saved=await loadPublishedFormulary({fetchImpl:async(url,options)=>{assert(url.href.endsWith('/formulary.json'));assert.equal(options.cache,'no-cache');return json(payload,{'X-DRef-Saved-Copy':'1'});}});
assert.equal(saved.savedCopy,true);assert.equal(saved.payload.records.length,2);
await assert.rejects(loadPublishedFormulary({fetchImpl:async()=>new Response('Sign in')}));
await assert.rejects(loadPublishedFormulary({fetchImpl:async()=>json({...payload,records:[]})}));
await assert.rejects(fetchJson('https://source.test/',{fetchImpl:async()=>new Response('Sign in')}));

// A failed source fetch must not change the file or signal a deployment.
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dref-sync-check-'));
try{
 const site=path.join(temp,'site');fs.mkdirSync(site);fs.writeFileSync(path.join(site,'index.html'),'app');
 const initial=preparePublication(payload,null);fs.writeFileSync(path.join(site,'formulary.json'),JSON.stringify(initial)+'\n');
 const liveRelease=writeRelease(site),configPath=path.join(temp,'config.json');
 fs.writeFileSync(configPath,JSON.stringify({sourceSheetId:sourceId,publicOrigin:'https://live.test',sourceUrl:'https://source.test'}));
 let currentSource=newTime;
 const fetchImpl=async url=>String(url).includes('source.test')?json(currentSource):String(url).endsWith('/release.json')?json(liveRelease):json(initial);
 const result=await sync({directory:site,configPath,fetchImpl});assert.equal(result.changed,false);
 const before=fs.readFileSync(path.join(site,'formulary.json'),'utf8');
 await assert.rejects(sync({directory:site,configPath,fetchImpl:async url=>String(url).includes('source.test')?new Response('Unavailable',{status:503}):fetchImpl(url)}));
 assert.equal(fs.readFileSync(path.join(site,'formulary.json'),'utf8'),before);
 currentSource=changed;assert.equal((await sync({directory:site,configPath,fetchImpl})).changed,true);
 assert.equal(JSON.parse(fs.readFileSync(path.join(site,'formulary.json'))).records[0].dosage,'Reviewed source dose');
}finally{fs.rmSync(temp,{recursive:true,force:true});}

// The monthly checkpoint commits once; it never contains Cloudflare secrets.
let calls=0;
await heartbeat({repository:'owner/dref',token:'test',now:new Date('2026-10-12'),fetchImpl:async(url,options)=>{calls++;if(options.method==='PUT'){assert(!options.body.includes('CLOUDFLARE'));return new Response('{}');}return new Response('',{status:404});}});
assert.equal(calls,2);
assert.equal(await productionBranch({accountId:'a'.repeat(32),token:'test',fetchImpl:async()=>json({success:true,result:{production_branch:'production'}})}),'production');
await assert.rejects(productionBranch({accountId:'a'.repeat(32),token:'test',fetchImpl:async()=>json({success:true,result:{production_branch:'main; echo unsafe'}})}));
assert.equal(await heartbeat({repository:'owner/dref',token:'test',now:new Date('2026-10-20'),fetchImpl:async()=>json({sha:'x',content:Buffer.from('{"month":"2026-10"}').toString('base64')})}),false);

// Apps Script continues to serve its original HTML, preserves the bridge,
// and exports only the fixed source fields + notice, with no write service.
const gs=fs.readFileSync(new URL('./Code-DRef-Static.gs',import.meta.url),'utf8');
const rows=[fields,[...fields.map(f=>record()[f]),'Pharmacy notice']];
function html(value){return {value,setTitle(){return this;},setXFrameOptionsMode(){return this;},evaluate(){return this;}};}
const context={SpreadsheetApp:{openById:id=>{assert.equal(id,sourceId);return {getSheetByName:name=>{assert.equal(name,'Sheet1');return {getLastRow:()=>2,getRange:(r,c,h,w)=>({getDisplayValues:()=>rows.slice(r-1,r-1+h).map(row=>row.slice(c-1,c-1+w))})};}};}},ContentService:{createTextOutput:value=>({value,setMimeType(type){assert.equal(type,'JSON');return this;}}),MimeType:{JSON:'JSON'}},HtmlService:{createTemplateFromFile:()=>html('original'),createHtmlOutput:html,XFrameOptionsMode:{ALLOWALL:1}},Date,JSON,String,Math};
vm.createContext(context);vm.runInContext(gs,context);
assert.equal(context.doGet().value,'original');
const exported=JSON.parse(context.doGet({parameter:{format:'dref-json',spreadsheetId:'wrong'}}).value);
assert.equal(exported.sourceId,sourceId);assert.equal(exported.records.length,1);assert.equal(exported.notice,'Pharmacy notice');
assert.equal(validatePayload(exported).records[0].dosage,'5 mg daily');
assert(context.doGet({parameter:{pwaBridge:'1',parentOrigin:'https://dref-my.pages.dev',requestId:'a'.repeat(48)}}).value.includes('DREF_FORMULARY_READY'));
assert(!/\.setValue|\.setValues|\.deleteRow|\.appendRow/.test(gs));
console.log('Passed static formulary: source validation, dose preservation, local storage, offline response, unchanged/failed/changed publishing, monthly checkpoint and fixed read-only Apps Script endpoint.');
