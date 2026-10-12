// Presentation/navigation only: calculator source scripts run unchanged.
(()=>{
 const embedded=window.parent!==window;
 const tool=document.querySelector('meta[name="dref-tool"]')?.content;
 if(!tool?.includes('cobb-angle'))document.documentElement.classList.add('dref-default-accent');else document.documentElement.classList.add('dref-image-measurement');
 if(window.Chart?.defaults?.font)window.Chart.defaults.font.family='IBM Plex Sans, Arial, sans-serif';
 const title=document.querySelector('h1,h2');title?.classList.add('dref-tool-title');
 if(!embedded)return;
 let lastHeight=0,scheduled=false;
 function sendSize(){scheduled=false;const height=Math.ceil(Math.max(document.body.scrollHeight,document.body.getBoundingClientRect().height));if(height!==lastHeight){lastHeight=height;parent.postMessage({type:'DREF_TOOL_HEIGHT',tool,height},location.origin);}}
 function queueSize(){if(!scheduled){scheduled=true;requestAnimationFrame(sendSize);}}
 if('ResizeObserver' in window)new ResizeObserver(queueSize).observe(document.body);
 window.addEventListener('load',queueSize);window.addEventListener('resize',queueSize);document.addEventListener('input',queueSize);document.addEventListener('click',()=>setTimeout(queueSize,50));
 document.fonts?.ready.then(queueSize);queueSize();
 document.addEventListener('click',event=>{const anchor=event.target.closest('a[href]');if(!anchor)return;let url;try{url=new URL(anchor.href);}catch{return;}if(['www.dref.my','dref.my'].includes(url.hostname)){event.preventDefault();parent.postMessage({type:'DREF_TOOL_LINK',tool,url:url.href},location.origin);}});
})();
