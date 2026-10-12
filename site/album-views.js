import {album,albumSource} from './album.js';

export function albumView(path,ui){
 const parts=path.split('/').filter(Boolean);
 if(parts[0]!=='album'||parts.length>3)return null;
 const {breadcrumb,pageHead,star,row,entries,escape,icon}=ui;
 const root=entries.find(e=>e.id==='chronic-medication-album');
 const source=url=>`<div class="album-source">Source: DRef.my · <a class="text-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer">View original album ↗</a><br>Medication photographs currently remain on the original DRef website.</div>`;
 if(parts.length===1){return {title:'Chronic Medication Album',entryId:root.id,html:`${breadcrumb([{title:'Chronic Medication Album'}])}<div class="detail-top"><div class="page-title">${pageHead('Chronic Medication Album','Select a medication category.')}</div>${star(root)}</div><nav class="album-category-grid" aria-label="Medication categories">${album.map(c=>`<a class="album-category" href="#/album/${c.id}"><strong>${escape(c.title)}</strong><span>${c.classes.length} ${c.classes.length===1?'class':'classes'} →</span></a>`).join('')}</nav>${source(albumSource)}`};}
 const category=album.find(c=>c.id===parts[1]);if(!category)return null;
 const categoryEntry=entries.find(e=>e.id==='album-'+category.id);
 if(parts.length===2)return {title:category.title,entryId:categoryEntry.id,html:`${breadcrumb([{title:'Chronic Medication Album',path:'/album'},{title:category.title}])}<div class="detail-top"><div class="page-title">${pageHead(category.title,'Select a drug class to view its medication album.')}</div>${star(categoryEntry)}</div><div class="panel album-list">${category.classes.map(c=>row(entries.find(e=>e.id==='album-'+category.id+'-'+c.id))).join('')}</div>${source(category.url)}`};
 const drugClass=category.classes.find(c=>c.id===parts[2]);if(!drugClass)return null;
 const entry=entries.find(e=>e.id==='album-'+category.id+'-'+drugClass.id);
 const products=drugClass.products||[];
 return {title:drugClass.title,entryId:entry.id,html:`${breadcrumb([{title:'Chronic Medication Album',path:'/album'},{title:category.title,path:'/album/'+category.id},{title:drugClass.title}])}<div class="detail-top"><div><h1>${escape(drugClass.title)}</h1><p class="muted" style="margin-top:14px">${escape(category.title)}</p></div>${star(entry)}</div>${products.length?`<section class="album-gallery"><h2>Products in this album</h2><div class="panel" style="margin-top:25px">${products.map(p=>`<div class="entry-row"><div class="entry-link"><h3>${escape(p.medicine)}</h3><p>${escape(p.brand)}</p></div></div>`).join('')}</div></section>`:''}<section class="external-album"><h2 style="margin-bottom:18px">Medication photographs</h2><p>View the product photographs on the original DRef album page.</p><a class="primary" href="${escape(drugClass.url)}" target="_blank" rel="noopener noreferrer">View photographs <span>↗</span></a></section>${source(drugClass.url)}`};
}
