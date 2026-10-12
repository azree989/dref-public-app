// One query shared by the persistent header and the homepage search.
export function createGlobalSearch({document,location,history,render,setTimeout,clearTimeout}){
 let query='',timer,editing=false;
 const header=document.querySelector('#search');
 const onResults=()=>location.hash.split('?')[0]==='#/search';
 const cancel=()=>{clearTimeout(timer);timer=undefined;};
 function sync(){if(header.value!==query)header.value=query;const home=document.querySelector('#home-search');if(home&&home.value!==query)home.value=query;}
 function updateResults(){
  cancel();if(!onResults())return;
  const params=new URLSearchParams(location.hash.split('?')[1]||'');
  const trimmed=query.trim();
  if(trimmed)params.set('q',trimmed);else{params.delete('q');params.delete('section');}
  const hash='#/search'+(params.size?'?'+params.toString():'');
  history.replaceState(null,'',hash);editing=true;try{render();}finally{editing=false;}
 }
 function input(event){
  query=event.target.value;sync();cancel();
  if(onResults()&&!event.isComposing){if(!query.trim())updateResults();else timer=setTimeout(updateResults,180);}
 }
 function submit(event){
  event.preventDefault();cancel();query=event.currentTarget.querySelector('input').value.trim();sync();
  const hash='#/search'+(query?'?q='+encodeURIComponent(query):'');
  if(location.hash===hash){render();return;}
  location.hash=hash;
 }
 header.addEventListener('input',input);
 header.addEventListener('compositionend',input);
 document.querySelector('#search-form').addEventListener('submit',submit);
 function mount(){
  cancel();if(!editing)query=onResults()?new URLSearchParams(location.hash.split('?')[1]||'').get('q')||'':'';sync();
  const home=document.querySelector('#home-search');
  if(home){home.addEventListener('input',input);document.querySelector('#home-search-form').addEventListener('submit',submit);}
 }
 return {mount,cancel};
}
