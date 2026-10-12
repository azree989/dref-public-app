import assert from 'node:assert/strict';
import {mountAlbumReader} from '../site/album-reader.js';
import {mountClinical} from '../site/clinical-view.js';
import {clinicalTools} from '../site/clinical-catalogue.js';
class Element{
 constructor(){this.events={};this.innerHTML='';this.value='';this.hidden=false;this.style={};this.classList={add(){},remove(){},toggle(){}};this.dataset={};this.tagName='DIV';this.clientWidth=800;this.clientHeight=600;this.naturalWidth=1600;this.naturalHeight=1000;}
 addEventListener(type,fn){this.events[type]=fn;}focus(){}showModal(){this.open=true;}close(){this.open=false;}
 querySelectorAll(selector){if(selector!=='[data-photo]')return [];return [...this.innerHTML.matchAll(/data-photo="(\d+)"/g)].map(m=>{const e=new Element();e.dataset.photo=m[1];return e;});}
 emit(type,extra={}){this.events[type]?.({target:this,preventDefault(){},...extra});}
}
function reader(key){const elements=new Map(),r=new Element();r.dataset.albumKey=key;r.querySelector=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};const root={querySelector:()=>r};return {r,get:id=>r.querySelector('#'+id),dispose:mountAlbumReader(root)};}
const album=reader('antihypertensives/ccb-dihydropyridines');
assert.equal(album.get('album-medicine').textContent,'Amlodipine 5mg Tablet');assert.equal(album.get('album-brand').textContent,'Covasc 5mg, Duopharma');assert.equal(album.get('album-photo-caption').textContent,'BOX');
const first=album.get('album-main-photo').src;album.get('album-next-photo').emit('click');assert.notEqual(album.get('album-main-photo').src,first);assert.equal(album.get('album-photo-caption').textContent,'STRIP (FRONT)');
album.get('album-prev-photo').emit('click');assert.equal(album.get('album-main-photo').src,first);
album.get('album-next-product').emit('click');assert.equal(album.get('album-brand').textContent,'Hovasc 5mg, Hovid');assert.equal(album.get('album-photo-count').textContent,'Photo 1 of 4');
album.get('album-enlarge').emit('click');assert.equal(album.get('album-photo-dialog').open,true);const fitted=album.get('album-zoom-image').style.width;album.get('album-zoom-plus').emit('click');assert.notEqual(album.get('album-zoom-image').style.width,fitted);album.get('album-zoom-close').emit('click');assert.equal(album.get('album-photo-dialog').open,false);
album.dispose();
const missing=reader('antihypertensives/acei');missing.get('album-product').value='3';missing.get('album-product').emit('change');assert.equal(missing.get('album-medicine').textContent,'Enalapril 5mg Tablet');assert.equal(missing.get('album-photo-missing').hidden,false);assert.equal(missing.get('album-open-photo').hidden,true);missing.dispose();

// An unrelated sender or an external origin cannot resize/navigate a tool.
const listeners={},frame=new Element(),workspace=new Element(),button=new Element();frame.contentWindow={};
globalThis.window={addEventListener:(n,fn)=>listeners[n]=fn,removeEventListener:n=>delete listeners[n]};globalThis.location={origin:'https://dref-my.pages.dev',hash:''};
const tool=clinicalTools.find(t=>t.id==='egfr-calculator-ckd-epi-2021'),root={querySelector:id=>id==='#clinical-frame'?frame:id==='#clinical-workspace'?workspace:button};
const dispose=mountClinical(root,{tool});
const event={origin:location.origin,source:frame.contentWindow,data:{type:'DREF_TOOL_HEIGHT',tool:tool.id,height:900}};
listeners.message({...event,origin:'https://other.test'});assert.equal(frame.style.height,undefined);listeners.message({...event,source:{}});assert.equal(frame.style.height,undefined);listeners.message(event);assert.equal(frame.style.height,'908px');
listeners.message({...event,data:{type:'DREF_TOOL_LINK',tool:tool.id,url:'https://www.dref.my/clinical-tools_1/has-bled-score-calculator'}});assert.equal(location.hash,'/tools/dref/has-bled-score-calculator');
dispose();assert.equal(listeners.message,undefined);
console.log('Passed album/tool UI contracts: captions, photo and medicine navigation, zoom, missing-photo state and exact frame/origin navigation guards.');
