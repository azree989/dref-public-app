import {album,albumSource} from './album.js?v=1.0';
import {readerMarkup} from './album-reader.js?v=1.0';

export function albumView(path,ui){
 const parts=path.split('/').filter(Boolean);
 if(parts[0]!=='album'||parts.length>3)return null;
 const {breadcrumb,pageHead,star,row,entries,escape,icon}=ui;
 const root=entries.find(e=>e.id==='chronic-medication-album');
 const source=url=>`<div class="album-source"><a class="text-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">Original album ↗</a></div>`;
 if(parts.length===1){return {title:'Chronic Medication Album',entryId:root.id,html:`${breadcrumb([{title:'Chronic Medication Album'}])}<div class="detail-top"><div class="page-title">${pageHead('Medication Album','')}</div>${star(root)}</div><nav class="album-category-grid" aria-label="Medication categories">${album.map(c=>`<a class="album-category" href="#/album/${c.id}"><strong>${escape(c.title)}</strong><span>${c.classes.length} ${c.classes.length===1?'class':'classes'} →</span></a>`).join('')}</nav>${source(albumSource)}`};}
 const category=album.find(c=>c.id===parts[1]);if(!category)return null;
 const categoryEntry=entries.find(e=>e.id==='album-'+category.id);
 if(parts.length===2)return {title:category.title,entryId:categoryEntry.id,html:`${breadcrumb([{title:'Chronic Medication Album',path:'/album'},{title:category.title}])}<div class="detail-top"><div class="page-title">${pageHead(category.title,'')}</div>${star(categoryEntry)}</div><div class="panel album-list">${category.classes.map(c=>row(entries.find(e=>e.id==='album-'+category.id+'-'+c.id))).join('')}</div>${source(category.url)}`};
 const drugClass=category.classes.find(c=>c.id===parts[2]);if(!drugClass)return null;
 const entry=entries.find(e=>e.id==='album-'+category.id+'-'+drugClass.id);
 return {title:drugClass.title,entryId:entry.id,reader:true,html:`${breadcrumb([{title:'Chronic Medication Album',path:'/album'},{title:category.title,path:'/album/'+category.id},{title:drugClass.title}])}<div class="detail-top"><div><h1>${escape(drugClass.title)}</h1></div>${star(entry)}</div>${readerMarkup(category.id+'/'+drugClass.id)}${source(drugClass.url)}`};
}

