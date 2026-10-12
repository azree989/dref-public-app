// DOM-contract test without a browser: receiving a new dose must leave an
// open medicine untouched until the user closes it, then use the new copy.
import assert from 'node:assert/strict';
import {fields} from '../site/formulary-logic.js';
const record=dose=>Object.fromEntries(fields.map(f=>[f,f==='genericName'?'Amlodipine 5 mg Tablet':f==='dosage'?dose:'']));
const payload=dose=>({schemaVersion:1,records:[record(dose)],notice:'Source pharmacy notice',fetchedAt:'2026-10-12T07:00:00.000Z'});
const saved=new Map([['dref-formulary:published-v1',JSON.stringify(payload('OLD SOURCE DOSE'))]]);
globalThis.localStorage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
globalThis.sessionStorage={getItem:()=>null,setItem(){}};
globalThis.location={hash:'#/formulary'};
globalThis.window={innerWidth:1200};
globalThis.document={visibilityState:'visible',addEventListener(){},removeEventListener(){}};
let received;globalThis.fetch=()=>new Promise(resolve=>received=resolve);
const originalInterval=globalThis.setInterval,originalClear=globalThis.clearInterval;
globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
class Element{
 constructor(){this.events={};this.innerHTML='';this.value='';this.hidden=false;this.attributes={};this.classList={add(){},remove(){},toggle(){}};}
 addEventListener(type,fn){this.events[type]=fn;}
 setAttribute(name,value){this.attributes[name]=value;}
 removeAttribute(name){delete this.attributes[name];}
 focus(){}scrollIntoView(){}
 querySelector(){return new Element();}
 querySelectorAll(selector){const attr=selector.match(/^\[([\w-]+)\]$/)?.[1];if(!attr)return [];return [...this.innerHTML.matchAll(new RegExp(attr+'="([^"]*)"','g'))].map(match=>{const e=new Element();e.dataset={[attr.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]:match[1]};return e;});}
 emit(type,extra={}){this.events[type]?.({preventDefault(){},stopPropagation(){},...extra});}
}
const elements=new Map(),root=new Element();root.querySelector=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
try{
 const {mountFormulary}=await import('../site/formulary-view.js');
 const dispose=mountFormulary(root),input=root.querySelector('#form-query');
 assert.equal(input.disabled,false,'Saved records should be searchable before the network responds.');
 input.value='Amlodipine';root.querySelector('#form-medicine-search').emit('submit');
 assert(root.querySelector('#form-med-details').innerHTML.includes('OLD SOURCE DOSE'));
 received(new Response(JSON.stringify(payload('NEW SOURCE DOSE')),{headers:{'Content-Type':'application/json'}}));
 await new Promise(resolve=>setTimeout(resolve,20));
 assert(root.querySelector('#form-med-details').innerHTML.includes('OLD SOURCE DOSE'));
 assert(!root.querySelector('#form-med-details').innerHTML.includes('NEW SOURCE DOSE'));
 assert(root.querySelector('#form-connection-status').textContent.includes('update ready'));
 root.querySelector('#form-close').emit('click');
 assert(!root.querySelector('#form-connection-status').textContent.includes('update ready'));
 root.querySelector('#form-medicine-search').emit('submit');
 assert(root.querySelector('#form-med-details').innerHTML.includes('NEW SOURCE DOSE'));
 dispose();
}finally{globalThis.setInterval=originalInterval;globalThis.clearInterval=originalClear;}
console.log('Passed UI contract: immediate saved search, open-dose preservation and applying a pending update after closing. Browser layout/device testing remains separate.');
