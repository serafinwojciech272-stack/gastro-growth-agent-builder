import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from './_shared/cors.ts';
Deno.serve(async (req) => {
 const cors=getCorsHeaders(req); if(req.method==='OPTIONS') return new Response('ok',{headers:cors}); if(req.method!=='POST') return out({error:'Method not allowed'},405,cors);
 const auth=req.headers.get('Authorization'); if(!auth?.startsWith('Bearer ')) return out({error:'Authentication required'},401,cors);
 const base=Deno.env.get('SUPABASE_URL'), key=Deno.env.get('SUPABASE_ANON_KEY'), gh=Deno.env.get('GITHUB_TOKEN');
 if(!base||!key) return out({error:'Supabase environment is incomplete'},500,cors); if(!gh) return out({status:'not_configured',message:'GITHUB_TOKEN is required for sandbox executor.'},503,cors);
 try {
  const sb=createClient(base,key,{global:{headers:{Authorization:auth}}}); const {data}=await sb.auth.getUser(); if(!data.user) return out({error:'Invalid session'},401,cors);
  const body=await req.json().catch(()=>null); const projectId=typeof body?.project_id==='string'?body.project_id:''; const repo=typeof body?.repository==='string'?body.repository:''; const ref=typeof body?.ref==='string'?body.ref:'main';
  if(!projectId||!repo) return out({error:'project_id and repository are required'},400,cors);
  const parts=repo.replace(/^https:\/\/github\.com\//,'').replace(/\.git$/,'').split('/'); if(parts.length!==2) return out({error:'Invalid GitHub repository.'},400,cors);
  const callbackUrl=base+'/functions/v1/gga-website-builder-executor'; const owner=parts[0],name=parts[1];
  const response=await fetch('https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(name)+'/actions/workflows/website-builder-build.yml/dispatches',{method:'POST',headers:{Authorization:'Bearer '+gh,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({ref,inputs:{project_id:projectId,callback_url:callbackUrl,build_ref:ref}})});
  if(!response.ok) return out({status:'dispatch_failed',httpStatus:response.status,detail:await response.text()},502,cors);
  return out({status:'queued',project_id:projectId,repository:repo,ref},202,cors);
 } catch(e){return out({error:e instanceof Error?e.message:'Executor failed.'},502,cors)}
});
function out(body:unknown,status:number,cors:Record<string,string>){return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})}
