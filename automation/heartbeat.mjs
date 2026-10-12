// One small monthly source-control checkpoint prevents GitHub's 60-day
// inactivity rule from disabling an otherwise healthy public schedule.
import {pathToFileURL} from 'node:url';
export async function heartbeat({repository,token,fetchImpl=fetch,now=new Date()}={}){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository||'')||!token)throw Error('Repository credentials are missing.');
 const url=`https://api.github.com/repos/${repository}/contents/.sync/last-check.json`;
 const headers={Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
 const current=await fetchImpl(url,{headers,signal:AbortSignal.timeout(15000)});
 if(current.status!==404&&!current.ok)throw Error('Could not read the monthly automation checkpoint.');
 const previous=current.ok?await current.json():null;
 let previousDate;try{previousDate=JSON.parse(Buffer.from(previous.content,'base64').toString()).month;}catch{}
 const month=now.toISOString().slice(0,7);
 if(previousDate===month)return false;
 const body={message:'Record monthly DRef sync check [skip ci]',content:Buffer.from(JSON.stringify({month})+'\n').toString('base64'),...(previous?.sha?{sha:previous.sha}:{})};
 const result=await fetchImpl(url,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!result.ok)throw Error('Monthly checkpoint failed. Check Actions contents-write permission.');
 console.log('Monthly automation checkpoint saved.');return true;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{await heartbeat({repository:process.env.GITHUB_REPOSITORY,token:process.env.GITHUB_TOKEN});}catch(error){console.error(error.message);process.exitCode=1;}}
