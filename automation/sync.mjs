import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {validatePayload,fields} from '../site/formulary-logic.js';
import {sameSnapshot} from '../site/formulary-data.js';
import {writeRelease} from './release.mjs';
export function preparePublication(source,previous,{allowLargeChange=false,sourceSheetId}={}){
 if(sourceSheetId&&source?.sourceId!==sourceSheetId)throw Error('The endpoint did not identify the expected formulary Sheet.');
 const next=validatePayload(source);
 if(!next.records.length)throw Error('Refusing to publish an empty formulary.');
 if(previous&&!allowLargeChange&&next.records.length<previous.records.length*.8)throw Error('Record count fell by more than 20%. Review the Sheet; then run manually with the large-change option if intended.');
 const value=sameSnapshot(previous,next)?previous:next;
 return {schemaVersion:1,records:value.records.map(r=>Object.fromEntries(fields.map(f=>[f,r[f]]))),notice:value.notice,fetchedAt:value.fetchedAt};
}
export async function fetchJson(url,{fetchImpl=fetch,optional=false}={}){
 try{
  const response=await fetchImpl(url,{headers:{Accept:'application/json','Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000),redirect:'follow'});
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('Endpoint did not return JSON. Check the Apps Script deployment and anonymous access.');
  const text=await response.text();if(text.length>4*1024*1024)throw Error('Response is too large.');
  return JSON.parse(text);
 }catch(error){if(optional)return null;throw error;}
}
export async function sync({directory='site',configPath='automation/config.json',allowLargeChange=false,fetchImpl=fetch}={}){
 const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
 const currentRaw=await fetchJson(config.publicOrigin+'/formulary.json',{fetchImpl,optional:true});
 let previous;
 try{previous=validatePayload(currentRaw);}catch{previous=validatePayload(JSON.parse(fs.readFileSync(path.join(directory,'formulary.json'),'utf8')));}
 // A failed or invalid source request throws before any file is replaced.
 const source=await fetchJson(config.sourceUrl,{fetchImpl});
 const published=preparePublication(source,previous,{allowLargeChange,sourceSheetId:config.sourceSheetId});
 fs.writeFileSync(path.join(directory,'formulary.json'),JSON.stringify(published)+'\n');
 const release=writeRelease(directory);
 const liveRelease=await fetchJson(config.publicOrigin+'/release.json',{fetchImpl,optional:true});
 const changed=release.fingerprint!==liveRelease?.fingerprint;
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`changed=${changed}\n`);
 console.log(changed?`Validated ${published.records.length} medicines. A publication is required.`:'No data or app change; publication skipped.');
 return {changed,published};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{await sync({allowLargeChange:process.env.ALLOW_LARGE_CHANGE==='true'});}catch(error){console.error(error.message);process.exitCode=1;}
}
