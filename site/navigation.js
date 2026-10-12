import {icon} from './icons.js?v=1.0';
export const dockItems=[
 {id:'home',path:'/',label:'Home',icon:'home',title:'Home'},
 {id:'album',path:'/album',label:'Album',icon:'layers',title:'Chronic Medication Album'},
 {id:'tools',path:'/tools',label:'Tools',icon:'calculator',title:'Clinical Tools'},
 {id:'formulary',path:'/formulary',label:'Formulary',icon:'pill',title:'Formulary Search'},
 {id:'favourites',path:'/favourites',label:'Favourites',icon:'star',title:'Favourites'}
];
export function activeArea(path){
 const parts=path.split('?')[0].split('/').filter(Boolean);
 if(!parts.length)return 'home';
 if(parts[0]==='album'||parts[0]==='drugs'&&parts[1]!=='formularies')return 'album';
 if(parts[0]==='tools')return 'tools';
 if(parts[0]==='formulary'||parts[0]==='drugs'&&parts[1]==='formularies')return 'formulary';
 if(parts[0]==='favourites')return 'favourites';
 return null;
}
export function dockView(path){
 const current=activeArea(path);
 return dockItems.map(item=>`<a class="dock-item${current===item.id?' active':''}" href="#${item.path}" aria-label="${item.title}"${current===item.id?' aria-current="page"':''}>${icon(item.icon)}<span>${item.label}</span></a>`).join('');
}
