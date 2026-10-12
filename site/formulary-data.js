import {validatePayload,fields} from './formulary-logic.js?v=1.0';
const CACHE_KEY='dref-formulary:published-v1';
const DATA_URL=new URL('./formulary.json',import.meta.url);
export function decodeSnapshot(raw){
 const value=validatePayload(raw);
 if(!value.records.length)throw new Error('The published formulary is empty.');
 return {schemaVersion:1,...value};
}
// Clinical text and pharmacy notice determine a revision, not a download time.
export function sameSnapshot(a,b){
 if(!a||!b)return false;
 return a.notice===b.notice&&a.records.length===b.records.length&&a.records.every((r,i)=>fields.every(f=>r[f]===b.records[i][f]));
}
export function readSavedFormulary(storage){
 try{return decodeSnapshot(JSON.parse((storage||globalThis.localStorage).getItem(CACHE_KEY)));}catch{return null;}
}
export function saveFormulary(value,storage){
 try{(storage||globalThis.localStorage).setItem(CACHE_KEY,JSON.stringify(decodeSnapshot(value)));return true;}catch{return false;}
}
export async function loadPublishedFormulary({signal,fetchImpl=globalThis.fetch}={}){
 const response=await fetchImpl(DATA_URL,{signal,cache:'no-cache',credentials:'same-origin',headers:{Accept:'application/json'}});
 if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('The published formulary could not be checked.');
 const text=await response.text();
 if(text.length>4*1024*1024)throw new Error('The published formulary is too large.');
 return {payload:decodeSnapshot(JSON.parse(text)),savedCopy:response.headers.get('X-DRef-Saved-Copy')==='1'};
}
