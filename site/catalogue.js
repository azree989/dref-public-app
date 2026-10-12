// Navigation, listing and search all derive from this catalogue.
import {album,albumSource} from './album.js?v=1.0';
import {albumPhotos} from './album-photos.js?v=1.0';
import {clinicalTools} from './clinical-catalogue.js?v=1.0';
export const primaryAreas = [
 {id:'album',title:'Chronic Medication Album',icon:'layers',path:'/album',description:'Browse medication photographs by category and drug class.'},
 {id:'tools',title:'Clinical Tools',icon:'calculator',path:'/tools',description:'Open calculators and clinical reference tools.'},
 {id:'formulary',title:'Formulary Search',icon:'pill',path:'/formulary',description:'Search the PKD Bachok formulary maintained by Farmasi Daerah.'}
];
export const sections = [
 {id:'drugs',title:'Drug references',icon:'pill',description:'Browse medicines by therapeutic area.',colour:'green'},
 {id:'tools',title:'Clinical tools',icon:'calculator',description:'Calculators and practical clinical utilities.',colour:'purple'},
 {id:'guidelines',title:'Guidelines',icon:'book',description:'Find reference sources and clinical guidance.',colour:'blue'},
 {id:'local',title:'Local resources',icon:'layers',description:'DRef resources and connected local services.',colour:'amber'}
];
export const groups = [
 {id:'chronic-album',section:'drugs',title:'Chronic Medication Album'},
 {id:'formularies',section:'drugs',title:'Formularies'},
 {id:'calculators',section:'tools',title:'Calculators'},
 {id:'reference-portals',section:'guidelines',title:'Reference portals'},
 {id:'dref',section:'local',title:'DRef connections'}
];
export const entries = [
 {id:'district-formulary',section:'drugs',group:'formularies',title:'PKD Bachok Formulary',description:'Search the district formulary maintained by Farmasi Daerah.',type:'embedded',path:'/formulary',source:'Farmasi Daerah · PKD Bachok',url:'https://script.google.com/macros/s/AKfycbzL9JH03csacl7msG01Y0Vdmi5qe34kU3uWx-1a1suwkbkQyNiTcvyw7ohjeHBEA8z8xg/exec',tags:['district','formulary','formulary search','PKD Bachok','Farmasi','LASA','dosage'],related:['fukkm']},
 {id:'amlodipine',section:'drugs',group:'chronic-album',title:'Amlodipine',description:'View the CCB (dihydropyridines) product directory.',type:'album',path:'/album/antihypertensives/ccb-dihydropyridines',alias:true,tags:['medicine','hypertension'],related:['fukkm','metformin']},
 {id:'metformin',section:'drugs',group:'chronic-album',title:'Metformin',description:'View the Biguanides album.',type:'album',path:'/album/antidiabetics/biguanides',alias:true,tags:['medicine','diabetes'],related:['fukkm','amlodipine']},
 {id:'chronic-medication-album',section:'drugs',group:'chronic-album',title:'Chronic Medication Album',description:'Medication photographs organised by category and drug class.',type:'album',path:'/album',source:'DRef.my',url:albumSource,tags:['album','photographs','medicine','identification'],related:['fukkm']},
 {id:'fukkm',section:'drugs',group:'formularies',title:'Formulari Ubat KKM',description:'Open the Ministry of Health medicines formulary.',type:'external',source:'Pharmaceutical Services Programme, MOH Malaysia',url:'https://pharmacy.moh.gov.my/en/apps/fukkm',tags:['FUKKM','formulary','drug','dosage','medicine'],related:['myformulary']},
 {id:'bmi',section:'tools',group:'calculators',title:'Body mass index',description:'A simple built-in calculation using weight and height.',type:'calculator',source:'CDC · BMI calculation formula',url:'https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html',tags:['BMI','weight','height'],related:['myformulary']},
 {id:'myformulary',section:'tools',group:'calculators',title:'MyFormulary calculators',description:'Open the pharmacy calculator collection.',type:'external',source:'MyFormulary · MOH Malaysia',url:'https://myformulary.pharmacy.gov.my/calculators',tags:['renal','creatinine','eGFR','body surface area','steroid'],related:['bmi','fukkm']},
 {id:'pharmacy-guidance',section:'guidelines',group:'reference-portals',title:'MOH pharmacy guidelines',description:'Browse guidelines published by the Pharmaceutical Services Programme.',type:'external',source:'Pharmaceutical Services Programme, MOH Malaysia',url:'https://pharmacy.moh.gov.my/en/documents-library/guidelines',tags:['guideline','pharmacy','KKM'],related:['fukkm']},
 {id:'dref-original',section:'local',group:'dref',title:'DRef website',description:'Access existing pages and tools while migration is underway.',type:'external',source:'DRef.my',url:'https://sites.google.com/view/drefmy2/',tags:['Mahligai','Bachok','local','Apps Script'],related:['dref-team']},
 {id:'dref-team',section:'local',group:'dref',title:'Meet the DRef team',description:'View the current team on the original DRef website.',type:'external',source:'DRef.my',url:'https://sites.google.com/view/drefmy2/meet-the-team',tags:['team','about','contact'],related:['dref-original']}
];
for(const category of album){
 entries.push({id:'album-'+category.id,section:'drugs',group:'chronic-album',title:category.title,description:'Browse drug classes in this medication category.',type:'album',path:'/album/'+category.id,albumCategory:category.id,source:'DRef.my',url:category.url,tags:[category.title,'medication','album'],related:['chronic-medication-album']});
 for(const drugClass of category.classes){
  const legacyMedicineTerms=entries.filter(e=>e.alias&&e.path==='/album/'+category.id+'/'+drugClass.id).flatMap(e=>[e.title,...e.tags]);
  entries.push({id:'album-'+category.id+'-'+drugClass.id,section:'drugs',group:'chronic-album',title:drugClass.title,description:category.title+' · Medication album',type:'album',path:'/album/'+category.id+'/'+drugClass.id,albumCategory:category.id,albumClass:drugClass.id,source:'DRef.my',url:drugClass.url,tags:[category.title,'album',...legacyMedicineTerms,...(albumPhotos[category.id+'/'+drugClass.id]||drugClass.products||[]).flatMap(p=>[p.medicine,p.brand])],related:['album-'+category.id,'fukkm']});
 }
}
for(const tool of clinicalTools)entries.push({id:'clinical-'+tool.id,section:'tools',group:'calculators',title:tool.title,description:tool.description,type:'clinical',path:tool.path,source:'DRef',tags:[tool.title,'clinical','calculator','guide'],related:['district-formulary']});
export const pathFor = item => item.path || `/${item.section}/${item.group}/${item.id}`;
export const searchEntries = query => {const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return entries.filter(e=>!e.alias&&words.every(w=>[e.title,e.description,e.source,...e.tags,sections.find(s=>s.id===e.section).title,groups.find(g=>g.id===e.group).title].join(' ').toLowerCase().includes(w)));};
