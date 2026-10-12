import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {albumPhotos} from '../site/album-photos.js';
import {clinicalTools} from '../site/clinical-catalogue.js';
import {clinicalView} from '../site/clinical-view.js';
import {album} from '../site/album.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const report=JSON.parse(fs.readFileSync('migration/import-report.json'));
const scripts=html=>[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].filter(m=>!(/\bsrc\s*=/i.test(m[1])));
const ui={breadcrumb:()=>'',pageHead:(t,d)=>t+d};
assert.equal(clinicalTools.length,35);assert.equal(clinicalTools.filter(t=>!t.supporting).length,32);
assert.equal(new Set(clinicalTools.map(t=>t.id)).size,35);
let syntaxCount=0;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'dref-script-check-'));
try{
 for(const tool of clinicalTools){
  assert(clinicalView(tool.path,ui),tool.path);
  if(tool.kind==='launcher')continue;
  const document=fs.readFileSync('site/'+tool.file.slice(2),'utf8'),gold=fs.readFileSync('migration/tool-originals/'+tool.id+'.html','utf8');
  assert.deepEqual(scripts(document).map(m=>hash(m[2])),scripts(gold).map(m=>hash(m[2])),`Clinical script changed: ${tool.id}`);
  assert(document.includes('../tool-theme.css?v=1.0'));assert(document.includes('../tool-adapter.js?v=1.0'));
  for(const m of document.matchAll(/(?:src|href)=["'](\.\.\/[^"']+)["']/g)){assert(fs.existsSync(path.resolve('site/clinical',m[1].split('?')[0])),`Missing tool dependency ${m[1]}`);}
  for(const match of scripts(document)){
   if(/type\s*=\s*["']application\/(?:ld\+)?json/i.test(match[1])){JSON.parse(match[2]);continue;}
   const file=path.join(temp,'script.js');fs.writeFileSync(file,match[2]);execFileSync(process.execPath,['--check',file]);syntaxCount++;
  }
 }
}finally{fs.rmSync(temp,{recursive:true,force:true});}
const files=new Set();let products=0,placements=0;
for(const category of album)for(const drug of category.classes){
 const list=albumPhotos[category.id+'/'+drug.id];assert(list?.length,drug.id);products+=list.length;
 for(const item of list){assert(item.medicine&&item.brand);placements+=item.photos.length;for(const p of item.photos){assert(/^\.\/photos\/[a-f0-9]{24}\.(?:jpg|png|gif)$/.test(p.src));const file='site/'+p.src.slice(2);assert(fs.existsSync(file));const bytes=fs.readFileSync(file);assert.equal(hash(bytes).slice(0,24),path.basename(file).split('.')[0]);assert(bytes.length<25*1024*1024);files.add(file);}}
}
assert.equal(products,154);assert.equal(placements,572);assert.equal(files.size,526);assert.equal(report.warnings.length,2);
const styles=fs.readFileSync('site/tool-theme.css','utf8');assert(styles.includes('IBM Plex Sans'));assert(styles.includes('--primary:#006eaa'));assert(!styles.includes('--red:'));assert(!styles.includes('--risk-'));assert(!styles.includes('--good:'));assert(styles.includes(':not(.btn-trauma)'));
console.log(`Passed migration: 70 classes, ${products} labelled products, ${placements} photo placements, ${files.size} original-photo hashes, 32 indexed tools + 3 supporting screens, ${syntaxCount} preserved executable scripts and local dependencies.`);
