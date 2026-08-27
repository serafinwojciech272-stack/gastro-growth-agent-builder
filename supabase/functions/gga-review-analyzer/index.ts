import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const { restaurantId, reviews } = await req.json();
    if (!restaurantId || !Array.isArray(reviews) || reviews.length === 0) throw new Error("restaurantId and reviews are required");

    const { data: restaurant, error: restaurantError } = await supabase.from("restaurants").select("id,name,cuisine,city,country,website,average_ticket,target_customer,business_goals,current_problems").eq("id", restaurantId).single();
    if (restaurantError) throw restaurantError;

    const allowed = reviews.slice(0, 100).map((r: { rating?: number; review_text?: string; source?: string }) => ({ rating: r.rating ?? null, review_text: String(r.review_text ?? "").slice(0, 2000), source: r.source ?? "manual" }));
    const prompt = `You are Gastro Growth Advisor Review Intelligence. Analyze restaurant reviews and return ONLY valid JSON. Restaurant: ${JSON.stringify(restaurant)} Reviews: ${JSON.stringify(allowed)} Schema: {"summary":string,"sentiment_breakdown":{"positive":number,"neutral":number,"negative":number},"recurring_issues":[{"issue":string,"frequency":number,"severity":"low|medium|high","evidence":string}],"strengths":[{"strength":string,"frequency":number}],"recommendations":[{"priority":"high|medium|low","recommendation":string,"reason":string,"action":string}]}. Do not invent facts. Base frequency on supplied reviews.`;
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
    const model = Deno.env.get("GGA_AI_MODEL") ?? "openai/gpt-4o-mini";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://gastrogrowthadvisor.com", "X-Title": "Gastro Growth Advisor" }, body: JSON.stringify({ model, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: "You are a precise restaurant reputation analyst." }, { role: "user", content: prompt }] }) });
    if (!response.ok) throw new Error(`AI provider error: ${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI returned no content");
    const result = JSON.parse(content);
    const { data: analysis, error } = await supabase.from("review_analyses").insert({ restaurant_id: restaurantId, summary: result.summary ?? "", sentiment_breakdown: result.sentiment_breakdown ?? {}, recurring_issues: result.recurring_issues ?? [], strengths: result.strengths ?? [], recommendations: result.recommendations ?? [], raw_result: result, created_by: user.id }).select().single();
    if (error) throw error;
    return new Response(JSON.stringify({ analysis }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
