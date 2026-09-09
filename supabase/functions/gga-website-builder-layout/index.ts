import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, parseJson } from '../_shared/ai.ts';
import { evaluateStructuredOutput, isRecord } from '../_shared/quality.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

type Stage = 'AI Layout Generation' | 'Component Generation' | 'Responsive Renderer';
type Project = { id:string; user_id:string; artifacts:Record<string,unknown>; version:number; active_stage:number; completed_stages:number[]; };
const STAGES: Stage[] = ['AI Layout Generation','Component Generation','Responsive Renderer'];
const COMPONENTS = ['SiteHeader','Hero','Proof','FeatureGrid','Offer','Media','Timeline','Faq','Venue','About','Testimonials','Contact','Cta','Footer','Gallery','Stats'] as const;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok',{headers:cors});
  if (req.method !== 'POST') return json({error:'Method not allowed'},405,cors);
  try {
    const authorization=req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({error:'Authentication required'},401,cors);
    const url=Deno.env.get('SUPABASE_URL'), key=Deno.env.get('SUPABASE_ANON_KEY');
    if(!url||!key) throw new Error('Supabase environment is incomplete');
    const sb=createClient(url,key,{global:{headers:{Authorization:authorization}}});
    const {data:{user}}=await sb.auth.getUser();
    if(!user) return json({error:'Invalid session'},401,cors);
    const body=await req.json().catch(()=>null);
    if(body?.action!=='run-stage') return json({error:'Only run-stage is supported'},400,cors);
    const stage=body.stage as Stage;
    if(!STAGES.includes(stage)) return json({error:'Unsupported layout stage'},400,cors);
    const projectId=typeof body.projectId==='string'?body.projectId:'';
    if(!projectId) return json({error:'projectId is required'},400,cors);
    const found=await sb.from('website_builder_projects').select('*').eq('id',projectId).eq('user_id',user.id).single();
    if(found.error) throw found.error;
    const project=found.data as Project;
    const result=await run(stage,project);
    const index=8+STAGES.indexOf(stage);
    const artifacts={...project.artifacts,[stage]:result.artifact};
    const completed=Array.from(new Set([...(project.completed_stages??[]),index])).sort((a,b)=>a-b);
    const updated=await sb.from('website_builder_projects').update({artifacts,active_stage:Math.min(index+1,10),completed_stages:completed,status:'ready',version:project.version+1}).eq('id',project.id).eq('user_id',user.id).select('*').single();
    if(updated.error) throw updated.error;
    return json({project:updated.data,stage,artifact:result.artifact,quality:result.quality},200,cors);
  } catch(error) { console.error('layout engine',error); return json({error:error instanceof Error?error.message:'Layout engine failed'},502,cors); }
});

async function run(stage:Stage,p:Project){
  const brand=p.artifacts['Brand Extraction']??{};
  const content=p.artifacts['Content Intelligence']??{};
  const architecture=p.artifacts['Page Architecture']??{};
  const visual=p.artifacts['Visual Direction']??{};
  if(stage==='AI Layout Generation'){
    const system=`You are a production website layout compiler. Convert the supplied approved architecture, content and visual tokens into a deterministic layout tree. Return JSON only: {schemaVersion,type,pages}. Each page has id,path,nodes[]. Each node has id,component,contentRefs[],variant,layout:{width,align,order},responsive:{mobile:{order,hidden,stack},tablet:{order,hidden,stack}}. component MUST be one of: ${COMPONENTS.join(', ')}. Never output JSX, HTML, CSS, URLs or executable code. Keep nodes semantic and conversion-focused.`;
    const ai=await callOpenRouter({task:'general',system,user:JSON.stringify({brand,content,architecture,visual}),temperature:0.1});
    const raw=parseJson<Record<string,unknown>>(ai.content); const pages=Array.isArray(raw.pages)?raw.pages.slice(0,20):[];
    const artifact={schemaVersion:'1.0',type:'ai-layout',pages};
    const q=evaluateStructuredOutput(artifact,{required:['schemaVersion','type','pages'],arrays:['pages'],minItems:{pages:1}});
    if(q.score<75) throw new Error(`AI Layout quality gate failed: ${q.score}`);
    return {artifact,quality:{score:q.score,gate:q.score>=90?'PASS':'PASS_WITH_WARNINGS'}};
  }
  if(stage==='Component Generation'){
    const layout=p.artifacts['AI Layout Generation'];
    if(!layout) throw new Error('AI Layout Generation must exist first');
    const pages=Array.isArray((layout as Record<string,unknown>).pages)?(layout as Record<string,unknown>).pages:[];
    const componentPages=pages.map((page,pageIndex)=>{
      const pageRecord=isRecord(page)?page:{};
      const pageNodes=Array.isArray(pageRecord.nodes)?pageRecord.nodes:[];
      return {id:typeof pageRecord.id==='string'?pageRecord.id:`page-${pageIndex+1}`,path:typeof pageRecord.path==='string'?pageRecord.path:'/',nodes:pageNodes.map((node,index)=>{
        const n=isRecord(node)?node:{};
        const requested=typeof n.component==='string'?n.component:'';
        const component=COMPONENTS.includes(requested as typeof COMPONENTS[number])?requested:'FeatureGrid';
        return {id:typeof n.id==='string'?n.id:`node-${pageIndex+1}-${index+1}`,component,props:{contentRefs:Array.isArray(n.contentRefs)?n.contentRefs.filter((x):x is string=>typeof x==='string').slice(0,20):[],variant:typeof n.variant==='string'?n.variant:'default'},accessibility:{landmark:component==='SiteHeader'?'banner':component==='Footer'?'contentinfo':'region',headingLevel:component==='Hero'?1:2}};
      })};
    });
    const artifact={schemaVersion:'1.0',type:'component-manifest',registryVersion:'1.0',allowedComponents:[...COMPONENTS],pages:componentPages};
    const q=evaluateStructuredOutput(artifact,{required:['schemaVersion','type','registryVersion','allowedComponents','pages'],arrays:['allowedComponents','pages'],minItems:{allowedComponents:5,pages:1}});
    return {artifact,quality:{score:q.score,gate:q.score>=90?'PASS':'PASS_WITH_WARNINGS'}};
  }
  const manifest=p.artifacts['Component Generation'];
  if(!manifest) throw new Error('Component Generation must exist first');
  const artifact={schemaVersion:'1.0',type:'responsive-renderer',engine:'growth-advisor-schema-renderer',breakpoints:{mobile:0,tablet:768,desktop:1024},states:['mobile','tablet','desktop'],componentSource:'controlled-registry',inputArtifact:'Component Generation',reducedMotion:true};
  return {artifact,quality:{score:100,gate:'PASS'}};
}
function json(body:unknown,status:number,cors:Record<string,string>){return new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}})}
