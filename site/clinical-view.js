import {clinicalTools} from './clinical-catalogue.js?v=1.0';
import {escapeHtml} from './formulary-logic.js?v=1.0';
export function clinicalView(path,ui){
 if(path==='/tools')return {title:'Clinical Tools',html:`${ui.breadcrumb([{title:'Clinical Tools'}])}${ui.pageHead('Clinical Tools','')}<div class="clinical-search"><label for="clinical-filter">Find a clinical tool</label><input id="clinical-filter" type="search" placeholder="e.g. eGFR, warfarin, asthma" autocomplete="off"></div><p id="clinical-count" class="muted"></p><div id="clinical-list" class="clinical-list">${clinicalTools.filter(t=>!t.supporting).map(t=>`<a class="clinical-row" href="#${t.path}" data-tool-search="${escapeHtml((t.title+' '+t.description).toLowerCase())}"><h2>${escapeHtml(t.title)}</h2><span aria-hidden="true">→</span></a>`).join('')}</div><p class="clinical-empty muted" id="clinical-empty" hidden>No matching tools. Try a broader term.</p><div class="clinical-other"><a href="#/tools/calculators/bmi">BMI calculator →</a><a href="#/tools/calculators/myformulary">MyFormulary calculators ↗</a></div>`,list:true};
 const tool=clinicalTools.find(t=>t.path===path);if(!tool)return null;
 const crumb=ui.breadcrumb([{title:'Clinical Tools',path:'/tools'},{title:tool.title}]);
 if(tool.kind==='launcher')return {title:tool.title,html:`${crumb}${ui.pageHead(tool.title,tool.description)}<div class="clinical-list">${clinicalTools.filter(t=>t.id.startsWith('cvd-risk-tool-')).map(t=>`<a class="clinical-row" href="#${t.path}"><h2>${escapeHtml(t.title)}</h2><span aria-hidden="true">→</span></a>`).join('')}</div>`};
 return {title:tool.title,tool,html:`${crumb}<div class="clinical-toolbar"><a href="#/tools">← Clinical tools</a><button id="clinical-fullscreen" type="button" class="form-text-button">Expand tool</button></div><section id="clinical-workspace" class="clinical-workspace"><iframe id="clinical-frame" title="${escapeHtml(tool.title)}" src="${tool.file}?v=1.0" sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe></section><p class="clinical-source"><a href="${escapeHtml(tool.url.replace('https://www.dref.my','https://sites.google.com/view/drefmy2'))}" target="_blank" rel="noopener noreferrer">Source ↗</a></p>`};
}
export function mountClinical(root,page){
 if(page.list){const input=root.querySelector('#clinical-filter'),rows=[...root.querySelectorAll('[data-tool-search]')];const filter=()=>{const q=input.value.trim().toLowerCase();let count=0;for(const row of rows){row.hidden=!row.dataset.toolSearch.includes(q);if(!row.hidden)count++;}root.querySelector('#clinical-count').textContent=`${count} clinical tool${count===1?'':'s'}`;root.querySelector('#clinical-empty').hidden=count>0;};input.addEventListener('input',filter);filter();return ()=>{};}
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

