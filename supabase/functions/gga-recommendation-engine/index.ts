import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers});
 try{
  const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:req.headers.get("Authorization")??""}}});
  const {data:{user}}=await supabase.auth.getUser(); if(!user) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers});
  const {restaurantId}=await req.json(); if(!restaurantId) throw new Error("restaurantId is required");
  const [{data:restaurant,error:re},{data:advisor},{data:menu},{data:reviews}]=await Promise.all([
   supabase.from("restaurants").select("*").eq("id",restaurantId).single(),
   supabase.from("ai_analyses").select("id,analysis_result,created_at").eq("restaurant_id",restaurantId).order("created_at",{ascending:false}).limit(3),
   supabase.from("menu_analyses").select("id,score,strengths,weaknesses,opportunities,recommendations,created_at").eq("restaurant_id",restaurantId).order("created_at",{ascending:false}).limit(3),
   supabase.from("review_analyses").select("id,summary,sentiment_breakdown,recurring_issues,strengths,recommendations,created_at").eq("restaurant_id",restaurantId).order("created_at",{ascending:false}).limit(3)
  ]); if(re) throw re;
  const apiKey=Deno.env.get("OPENROUTER_API_KEY"); if(!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
  const model=Deno.env.get("GGA_AI_MODEL")??"openai/gpt-4o-mini";
  const prompt=`You are the GGA Recommendation Engine. Synthesize existing restaurant intelligence into a prioritized action backlog. Do not invent metrics. Return ONLY JSON with {recommendations:[{source_type,title,problem,rationale,priority,expected_impact,confidence,action_payload}]} where priority is critical|high|medium|low and source_type is advisor|menu|reviews|marketing|competitor|seo|analytics. Restaurant=${JSON.stringify(restaurant)} Advisor=${JSON.stringify(advisor??[])} Menu=${JSON.stringify(menu??[])} Reviews=${JSON.stringify(reviews??[])}`;
  const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json","HTTP-Referer":"https://gastrogrowthadvisor.com","X-Title":"Gastro Growth Advisor"},body:JSON.stringify({model,temperature:.15,response_format:{type:"json_object"},messages:[{role:"system",content:"You are a rigorous restaurant growth strategist. Prioritize actions by impact, evidence and feasibility."},{role:"user",content:prompt}]})});
  if(!response.ok) throw new Error(`AI provider error: ${response.status}`); const payload=await response.json(); const result=JSON.parse(payload.choices?.[0]?.message?.content??"{}");
  const rows=(result.recommendations??[]).slice(0,20).map((r:any)=>({restaurant_id:restaurantId,source_type:r.source_type??"advisor",title:String(r.title??"Untitled recommendation").slice(0,180),problem:r.problem??null,rationale:r.rationale??null,priority:r.priority??"medium",expected_impact:r.expected_impact??null,confidence:Number(r.confidence??0),action_payload:r.action_payload??{},created_by:user.id}));
  if(rows.length){ const {error}=await supabase.from("recommendations").insert(rows); if(error) throw error; }
  return new Response(JSON.stringify({count:rows.length,recommendations:rows}),{headers});
 }catch(error){return new Response(JSON.stringify({error:error instanceof Error?error.message:"Unknown error"}),{status:400,headers});}
});
