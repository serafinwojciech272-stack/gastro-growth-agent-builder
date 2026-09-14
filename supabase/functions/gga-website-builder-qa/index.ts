import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS={'Access-Control-Allow-Origin':'https://gastrogrowthadvisor.com','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
type Project={id:string;user_id:string;artifacts:Record<string,unknown>;version:number;active_stage:number;completed_stages:number[]};
const registry=['SiteHeader','Hero','Proof','FeatureGrid','Offer','Media','Timeline','Faq','Venue','About','Testimonials','Contact','Cta','Footer','Gallery','Stats'];

Deno.serve(async(req)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});if(req.method!=='POST')return out({error:'Method not allowed'},405);try{const auth=req.headers.get('Authorization');if(!auth?.startsWith('Bearer '))return out({error:'Authentication required'},401);const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_ANON_KEY');if(!url||!key)throw new Error('Supabase environment is incomplete');const sb=createClient(url,key,{global:{headers:{Authorization:auth}}});const {data:{user}}=await sb.auth.getUser();if(!user)return out({error:'Invalid session'},401);const body=await req.json().catch(()=>null);const id=typeof body?.projectId==='string'?body.projectId:'';if(!id)return out({error:'projectId is required'},400);const found=await sb.from('website_builder_projects').select('*').eq('id',id).eq('user_id',user.id).single();if(found.error)throw found.error;const p=found.data as Project;const report=qa(p);const artifacts={...p.artifacts,QA:report};const passed=report.releaseGate==='PASS';const completed=Array.from(new Set([...(p.completed_stages??[]),...(passed?[9]:[])])).sort((a,b)=>a-b);const updated=await sb.from('website_builder_projects').update({artifacts,status:passed?'ready':'blocked',active_stage:passed?10:p.active_stage,completed_stages:completed,version:p.version+1}).eq('id',p.id).eq('user_id',user.id).select('*').single();if(updated.error)throw updated.error;return out({project:updated.data,qa:report},200)}catch(e){console.error('builder qa',e);return out({error:e instanceof Error?e.message:'QA failed'},502)}});

function qa(p:Project){
  const a=p.artifacts;
  const checks=[
    c('accessibility',Boolean(a['Component Generation']),['Component manifest must exist.']),
    c('responsive',Boolean(a['Responsive Renderer']),['Responsive renderer artifact must exist.']),
    c('links',Boolean(a['Page Architecture']),['Page architecture must exist.']),
    c('content',Boolean(a['Content Intelligence']),['Content intelligence must exist.']),
    c('runtime',Boolean(a['Component Generation']&&a['Responsive Renderer']),['Controlled component registry and renderer must exist.']),
  ];
  const manifest=a['Component Generation'] as Record<string,unknown>|undefined;
  const pages=Array.isArray(manifest?.pages)?manifest.pages:[];
  const allowed=Array.isArray(manifest?.allowedComponents)?manifest.allowedComponents:[];
  const validAllowed=allowed.length>0&&allowed.every(x=>registry.includes(String(x)));
  const ids=new Set<string>();
  const paths=new Set<string>();
  let nodeCount=0;
  let invalidNodes=0;
  let missingRefs=0;
  const content=a['Content Intelligence'] as Record<string,unknown>|undefined;
  const knownRefs=new Set<string>();
  for(const pool of ['entities','facts','claims','sections','ctas','faqs','proposedCopy']){const items=Array.isArray(content?.[pool])?content?.[pool] as unknown[]:[];for(const item of items){if(item&&typeof item==='object'){const r=item as Record<string,unknown>;for(const key of ['id','key','slug'])if(typeof r[key]==='string')knownRefs.add(r[key] as string);}}}
  for(const page of pages){
    if(!page||typeof page!=='object'){invalidNodes++;continue;}
    const pr=page as Record<string,unknown>;
    const path=typeof pr.path==='string'?pr.path:'/';
    if(paths.has(path)) checks.push(c('routing',false,[`Duplicate page path: ${path}`])); else paths.add(path);
    const nodes=Array.isArray(pr.nodes)?pr.nodes:[];
    for(const node of nodes){
      nodeCount++;
      if(!node||typeof node!=='object'){invalidNodes++;continue;}
      const n=node as Record<string,unknown>;
      const id=typeof n.id==='string'?n.id:'';
      const component=String(n.component||'');
      if(!id||ids.has(id)||!registry.includes(component)) invalidNodes++; else ids.add(id);
      const props=n.props&&typeof n.props==='object'&&!Array.isArray(n.props)?n.props as Record<string,unknown>:{};
      const refs=Array.isArray(props.contentRefs)?props.contentRefs:[];
      for(const ref of refs)if(typeof ref==='string'&&knownRefs.size>0&&!knownRefs.has(ref))missingRefs++;
    }
  }
  checks.push(c('schema',pages.length>0&&validAllowed&&invalidNodes===0,[...(!pages.length?['At least one page is required.']:[]),...(!validAllowed?['Component registry is empty or contains unknown components.']:[]),...(invalidNodes?[`${invalidNodes} invalid or duplicate component nodes found.`]:[])]));
  checks.push(c('content-links',missingRefs===0,[...(missingRefs?[`${missingRefs} component content references do not resolve to known content entities.`]:[])]));
  const runtime=checks.find(x=>x.check==='runtime');
  if(runtime&&!validAllowed){runtime.status='fail';runtime.score=0;runtime.findings=['Component manifest contains an unknown or empty component registry.'];}
  const score=Math.round(checks.reduce((s,x)=>s+x.score,0)/checks.length);
  const releaseGate=checks.some(x=>x.status==='fail')?'BLOCKED':score>=95?'PASS':'PASS_WITH_WARNINGS';
  return{schemaVersion:'1.1',type:'qa-report',generatedAt:new Date().toISOString(),checks,score,releaseGate,metrics:{pages:pages.length,nodes:nodeCount,uniqueNodeIds:ids.size,knownContentRefs:knownRefs.size},notes:['Structural QA validates artifact integrity, registry safety, routing uniqueness and content references. Browser screenshot and interaction QA still belongs in the CI browser workflow.']};
}
function c(check:string,ok:boolean,findings:string[]){return{check,status:ok?'pass':'fail',score:ok?100:0,findings};}
function out(body:unknown,status:number){return new Response(JSON.stringify(body),{status,headers:{...CORS,'Content-Type':'application/json'}})}
