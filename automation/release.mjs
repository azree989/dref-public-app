import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export function releaseFingerprint(directory){
 const hash=createHash('sha256');
 function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  const file=path.join(folder,entry.name),relative=path.relative(directory,file).replaceAll('\\','/');
  if(entry.isDirectory())walk(file);
  else if(relative!=='release.json'){hash.update(relative+'\0');hash.update(fs.readFileSync(file));hash.update('\0');}
 }}
 walk(directory);return hash.digest('hex');
}
export function writeRelease(directory){
 const result={schemaVersion:1,version:'0.9',fingerprint:releaseFingerprint(directory)};
 fs.writeFileSync(path.join(directory,'release.json'),JSON.stringify(result)+'\n');return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)writeRelease(path.resolve(process.argv[2]||'site'));
