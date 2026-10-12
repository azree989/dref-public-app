const CACHE='dref-shell-0.9-pages';
const ROOT=new URL('./',self.location.href);
// Exact allowlist: never cache requests to other sites, API responses, or sign-in pages.
const ASSETS=['index.html','styles.css','app.js','catalogue.js','storage.js','icons.js','navigation.js','album.js','album-views.js','formulary-view.js','formulary-logic.js','formulary-bridge.js','formulary-data.js','formulary.json','vendor/fuse.mjs','manifest.webmanifest','icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/dref-logo.png','fonts/ibm-plex-sans-400.ttf','fonts/ibm-plex-sans-500.ttf','fonts/ibm-plex-sans-600.ttf','fonts/ibm-plex-sans-700.ttf'].concat(['styles.css?v=0.9','app.js?v=0.9']).map(p=>new URL(p,ROOT).href);
function validSnapshot(value){const fields=['genericName','brandName','dosage','indications','prescriberCategory','pictureUrl','lasaGeneric','tallManGeneric','lasaBrand'];return value?.schemaVersion===1&&Array.isArray(value.records)&&value.records.length>0&&value.records.length<=15000&&typeof value.notice==='string'&&typeof value.fetchedAt==='string'&&Number.isFinite(Date.parse(value.fetchedAt))&&value.records.every(r=>r&&typeof r.genericName==='string'&&r.genericName.trim()&&fields.every(f=>typeof r[f]==='string'&&r[f].length<=200000));}
async function safeResponse(url){
 const r=await fetch(url,{cache:'reload'});
 const expected=new URL(url),actual=new URL(r.url);
 const document=url===new URL('index.html',ROOT).href;
 // Pages redirects /index.html to /. Permit only this exact same-origin
 // document redirect, and verify the returned app before caching it.
 const pageRoot=document&&actual.origin===ROOT.origin&&actual.pathname===ROOT.pathname&&!actual.search;
 if(!r.ok||actual.origin!==expected.origin||(!pageRoot&&(r.redirected||actual.pathname!==expected.pathname)))throw new Error('Asset unavailable');
 if(document){const body=await r.clone().text();if(!body.includes('id="search-form"')||!body.includes('id="mobile-dock"'))throw new Error('Not the app document');}
 if(url===new URL('formulary.json',ROOT).href&&(!r.headers.get('content-type')?.includes('application/json')||!validSnapshot(await r.clone().json())))throw new Error('Invalid formulary');
 return r;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{const responses=await Promise.all(ASSETS.map(safeResponse));const cache=await caches.open(CACHE);await Promise.all(ASSETS.map((url,i)=>cache.put(url,responses[i])));})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('dref-shell-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const r=event.request;if(r.method!=='GET'||!r.url.startsWith(ROOT.origin+'/'))return;const url=new URL(r.url);if(url.href===new URL('formulary.json',ROOT).href){event.respondWith((async()=>{try{const response=await safeResponse(url.href);try{const cache=await caches.open(CACHE);await cache.put(url.href,response.clone());}catch{}return response;}catch{const saved=await caches.match(url.href);if(!saved)return Response.error();const headers=new Headers(saved.headers);headers.set('X-DRef-Saved-Copy','1');return new Response(await saved.text(),{headers});}})());return;}if(r.mode==='navigate'&&(url.pathname===ROOT.pathname||url.href===new URL('index.html',ROOT).href)){event.respondWith(fetch(r).catch(async()=>{const offline=await caches.match(new URL('index.html',ROOT).href);return offline||Response.error();}));return;}if(ASSETS.includes(url.href)&&!url.href.endsWith('index.html'))event.respondWith(caches.match(r).then(cached=>cached||fetch(r)));});
