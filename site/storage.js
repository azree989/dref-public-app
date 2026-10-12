const prefix='dref-preview:';
export let storageAvailable=true;
export function read(key){try {const value=JSON.parse(localStorage.getItem(prefix+key)||'[]');return Array.isArray(value)?value.filter(x=>typeof x==='string'):[];}catch {storageAvailable=false;return [];}}
export function write(key,value){try {localStorage.setItem(prefix+key,JSON.stringify(value));return true;}catch {storageAvailable=false;return false;}}
export function bmi(weight,heightCm){if(!Number.isFinite(weight)||!Number.isFinite(heightCm)||weight<=0||heightCm<=0)return null;return weight/((heightCm/100)**2);}
