import {validatePayload} from './formulary-logic.js?v=1.0';
export const formularyAppUrl='https://script.google.com/macros/s/AKfycbzL9JH03csacl7msG01Y0Vdmi5qe34kU3uWx-1a1suwkbkQyNiTcvyw7ohjeHBEA8z8xg/exec';
export function allowedBridgeOrigin(origin){try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||/^[a-z0-9-]+-script\.googleusercontent\.com$/.test(u.hostname));}catch{return false;}}
export function acceptsBridgeMessage(event,requestId,frame){
 if(!allowedBridgeOrigin(event.origin)||!['DREF_FORMULARY_READY','DREF_FORMULARY_RESPONSE'].includes(event.data?.type)||event.data?.requestId!==requestId)return false;
 // HtmlService uses /exec → sandboxFrame → userHtmlFrame. Cross-origin
 // WindowProxy permits numbered child access, but not DOM inspection.
 let source=frame.contentWindow;
 for(let depth=0;source&&depth<8;depth++){
  if(event.source===source)return true;
  try{source=source.frames[0];}catch{return false;}
 }
 return false;
}
export function loadFormulary({signal,timeout=60000,onProgress}={}){return new Promise((resolve,reject)=>{
 const frame=document.createElement('iframe');
 const bytes=crypto.getRandomValues(new Uint8Array(24));
 const requestId=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
 const url=new URL(formularyAppUrl);
 url.searchParams.set('pwaBridge','1');url.searchParams.set('parentOrigin',location.origin);url.searchParams.set('requestId',requestId);
 frame.hidden=true;frame.title='Read-only formulary data connection';frame.setAttribute('aria-hidden','true');frame.setAttribute('tabindex','-1');frame.referrerPolicy='no-referrer';
 let timer,connected=false;
 const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',receive);signal?.removeEventListener('abort',abort);frame.remove();};
 const abort=()=>{cleanup();reject(new DOMException('Request cancelled.','AbortError'));};
 const receive=event=>{
  if(!acceptsBridgeMessage(event,requestId,frame))return;
  if(event.data.type==='DREF_FORMULARY_READY'){connected=true;onProgress?.('Connected to pharmacy · reading medicines…');return;}
  try{
   if(event.data.ok!==true)throw new Error('The pharmacy connection responded, but could not read Sheet1. Check the Apps Script execution log and spreadsheet access.');
   const data=validatePayload(event.data.payload);cleanup();resolve(data);
  }catch(e){cleanup();reject(e);}
 };
 window.addEventListener('message',receive);signal?.addEventListener('abort',abort,{once:true});
 if(signal?.aborted){abort();return;}
 timer=setTimeout(()=>{cleanup();reject(new Error(connected?'The pharmacy connection opened, but the spreadsheet did not respond in time. Retry with Refresh.':'No response from the pharmacy connection. Confirm the corrected Code.gs is deployed, or open Existing search separately to check Google access.'));},timeout);
 frame.src=url.href;document.body.append(frame);
});}
