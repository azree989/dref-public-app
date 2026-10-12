import {clinicalTools} from './clinical-catalogue.js?v=1.1';
import {escapeHtml} from './formulary-logic.js?v=1.0';
export function clinicalView(path,ui){
 if(path==='/tools')return {title:'Clinical Tools',html:`${ui.breadcrumb([{title:'Clinical Tools'}])}<section class="clinical-directory"><div class="clinical-heading"><h1>DRef Clinical <span>Tools</span></h1><p>Any calculations must be rechecked and should not be used alone to guide patient care.</p></div><nav class="clinical-tabs" aria-label="Filter clinical tools">${['All','Popular','Local Solutions','Recent'].map(cat=>`<button type="button" data-clinical-category="${cat}" class="${cat==='All'?'active':''}" aria-pressed="${cat==='All'}">${cat==='Recent'?'Tools You Just Opened':cat}</button>`).join('')}</nav><div class="clinical-search"><label for="clinical-filter">Find a clinical tool</label><input id="clinical-filter" type="search" placeholder="Search tools…" autocomplete="off"></div><p id="clinical-count" class="muted" role="status" aria-live="polite"></p><div id="clinical-list" class="clinical-list"></div><p class="clinical-empty muted" id="clinical-empty" hidden>No matching tools. Try a broader term.</p><div class="clinical-other"><a href="#/tools/calculators/bmi">BMI calculator →</a><a href="#/tools/calculators/myformulary">MyFormulary calculators ↗</a></div><p class="clinical-credits">Tools coded and built locally by the DRef team.</p></section>`,list:true};
 const tool=clinicalTools.find(t=>t.path===path);if(!tool)return null;
 rememberClinical(tool);
 const crumb=ui.breadcrumb([{title:'Clinical Tools',path:'/tools'},{title:tool.title}]);
 if(tool.kind==='launcher')return {title:tool.title,html:`${crumb}${ui.pageHead(tool.title,tool.description)}<div class="clinical-list">${clinicalTools.filter(t=>t.id.startsWith('cvd-risk-tool-')).map(t=>`<a class="clinical-row" href="#${t.path}"><h2>${escapeHtml(t.title)}</h2><span aria-hidden="true">→</span></a>`).join('')}</div>`};
 return {title:tool.title,tool,html:`${crumb}<div class="clinical-toolbar"><a href="#/tools">← Clinical tools</a><button id="clinical-fullscreen" type="button" class="form-text-button">Expand tool</button></div><section id="clinical-workspace" class="clinical-workspace"><iframe id="clinical-frame" title="${escapeHtml(tool.title)}" src="${tool.file}?v=1.0" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe></section><p class="clinical-source">From the existing DRef tool · <a href="${escapeHtml(tool.url.replace('https://www.dref.my','https://sites.google.com/view/drefmy2'))}" target="_blank" rel="noopener noreferrer">Original source ↗</a></p>`};
}
export function mountClinical(root,page){
 if(page.list){
  const input=root.querySelector('#clinical-filter'),container=root.querySelector('#clinical-list'),tabs=[...root.querySelectorAll('[data-clinical-category]')];
  const catalogue=clinicalTools.filter(t=>!t.supporting).sort((a,b)=>a.title.localeCompare(b.title));
  let category='All';
  const filter=()=>{
   const q=input.value.trim().toLowerCase();
   const recent=readRecentClinical();
   const base=category==='Recent'?recent.map(id=>catalogue.find(t=>t.id===id)).filter(Boolean):category==='All'?catalogue:catalogue.filter(t=>t.categories?.includes(category));
   const list=base.filter(t=>(t.title+' '+t.description).toLowerCase().includes(q));
   container.innerHTML=list.map(t=>`<a class="clinical-row" href="#${t.path}" data-tool-search="${escapeHtml((t.title+' '+t.description).toLowerCase())}"><h2>${escapeHtml(t.title)}</h2><p>${escapeHtml(t.description)}</p><span aria-hidden="true">→</span></a>`).join('');
   root.querySelector('#clinical-count').textContent=`Showing ${list.length} clinical tool${list.length===1?'':'s'}`;
   const empty=root.querySelector('#clinical-empty');empty.hidden=list.length>0;
   empty.textContent=category==='Recent'&&!recent.length?'Tools you open will appear here during this session.':'No matching tools. Try a broader term.';
  };
  tabs.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.clinicalCategory;tabs.forEach(tab=>{tab.classList.toggle('active',tab===button);tab.setAttribute('aria-pressed',String(tab===button));});filter();}));
  input.addEventListener('input',filter);filter();return ()=>{};
 }
 if(!page.tool)return ()=>{};
 const frame=root.querySelector('#clinical-frame'),workspace=root.querySelector('#clinical-workspace');
 const receive=event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.tool!==page.tool.id)return;
  if(event.data.type==='DREF_TOOL_HEIGHT'&&Number.isFinite(event.data.height)){frame.style.height=Math.min(24000,Math.max(550,event.data.height+8))+'px';}
  if(event.data.type==='DREF_TOOL_LINK'){
   let url;try{url=new URL(event.data.url);}catch{return;}if(!['www.dref.my','dref.my'].includes(url.hostname))return;
   const match=clinicalTools.find(t=>new URL(t.url).pathname===url.pathname);
   if(match)location.hash=match.path;
   else if(url.pathname.includes('clinical-tools'))location.hash='/tools';
   else if(url.pathname.includes('chronic'))location.hash='/album';
   else window.open(url.href.replace('https://www.dref.my','https://sites.google.com/view/drefmy2'),'_blank','noopener,noreferrer');
  }
 };
 window.addEventListener('message',receive);
 root.querySelector('#clinical-fullscreen').addEventListener('click',()=>{if(workspace.requestFullscreen)workspace.requestFullscreen();else frame.focus();});
 return ()=>window.removeEventListener('message',receive);
}

function readRecentClinical(){
 try{const value=JSON.parse(sessionStorage.getItem('dref-clinical-recent')||'[]');return Array.isArray(value)?value.filter(id=>typeof id==='string'):[];}catch{return [];}
}
function rememberClinical(tool){
 if(tool.supporting)return;
 try{sessionStorage.setItem('dref-clinical-recent',JSON.stringify([tool.id,...readRecentClinical().filter(id=>id!==tool.id)].slice(0,10)));}catch{}
}
