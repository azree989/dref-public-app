import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export async function productionBranch({accountId,token,projectName='dref-my',fetchImpl=fetch}={}){
 if(!/^[a-f0-9]{32}$/i.test(accountId||'')||!token||!/^[a-z0-9-]+$/.test(projectName))throw Error('Set the Cloudflare account ID and API token in GitHub repository secrets.');
 const result=await fetchImpl(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
 if(!result.ok)throw Error('Cloudflare could not read the dref-my Pages project. Check the account ID and Pages Edit permission.');
 const body=await result.json(),branch=body.result?.production_branch;
 if(body.success!==true||!/^[A-Za-z0-9._/-]{1,128}$/.test(branch||''))throw Error('Cloudflare did not identify a valid production branch.');
 return branch;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{
 const branch=await productionBranch({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_API_TOKEN});
 if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`branch=${branch}\n`);
 console.log('Existing Pages production branch verified.');
}catch(error){console.error(error.message);process.exitCode=1;}}
