import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type AdvisorResult = {
  diagnosis: string;
  root_causes: string[];
  recommendations: { title: string; rationale: string; priority: 'low' | 'medium' | 'high' | 'critical'; actions: string[] }[];
  priority: 'low' | 'medium' | 'high' | 'critical';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    const model = Deno.env.get('GGA_AI_MODEL') || 'openai/gpt-4o-mini';
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: 'Supabase environment is incomplete' }, 500);
    if (!openRouterKey) return json({ error: 'AI provider is not configured. Set OPENROUTER_API_KEY.' }, 503);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Invalid session' }, 401);

    const body = await req.json();
    const problem = typeof body?.problem === 'string' ? body.problem.trim() : '';
    if (problem.length < 8) return json({ error: 'Describe the restaurant problem in at least 8 characters.' }, 400);
    if (problem.length > 4000) return json({ error: 'Problem description is too long.' }, 400);

    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members').select('organization_id').eq('user_id', user.id).limit(1);
    if (membershipError) throw membershipError;
    const organizationId = memberships?.[0]?.organization_id;
    if (!organizationId) return json({ error: 'No restaurant workspace found.' }, 404);

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id,name,cuisine,city,country,website,price_segment,seats,average_ticket,target_customer,business_goals,current_problems,opening_hours')
      .eq('organization_id', organizationId).limit(1).maybeSingle();
    if (restaurantError) throw restaurantError;
    if (!restaurant) return json({ error: 'Complete restaurant onboarding first.' }, 404);

    const system = `You are GGA, Gastro Growth Advisor. You are a practical restaurant business strategist. Analyze the user's problem using the restaurant context. Never invent facts. Separate known context from assumptions. Prioritize actions by business impact and effort. Return valid JSON only with this exact shape: {"diagnosis":string,"root_causes":string[],"recommendations":[{"title":string,"rationale":string,"priority":"low|medium|high|critical","actions":string[]}],"priority":"low|medium|high|critical"}. Keep diagnosis under 700 characters. Return 2-5 root causes and 2-4 recommendations. Each recommendation needs 2-4 concrete actions.`;
    const context = JSON.stringify({ restaurant, user_problem: problem });

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': supabaseUrl, 'X-Title': 'Gastro Growth Advisor' },
      body: JSON.stringify({ model, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: context }] }),
    });
    if (!aiResponse.ok) return json({ error: `AI provider error (${aiResponse.status}).` }, 502);
    const aiPayload = await aiResponse.json();
    const raw = aiPayload?.choices?.[0]?.message?.content;
    if (typeof raw !== 'string') return json({ error: 'AI returned an empty response.' }, 502);

    let result: AdvisorResult;
    try { result = JSON.parse(raw); } catch { return json({ error: 'AI returned invalid structured data.' }, 502); }

    const allowed = new Set(['low', 'medium', 'high', 'critical']);
    result.priority = allowed.has(result.priority) ? result.priority : 'medium';
    result.root_causes = Array.isArray(result.root_causes) ? result.root_causes.slice(0, 5).map(String) : [];
    result.recommendations = Array.isArray(result.recommendations) ? result.recommendations.slice(0, 4).map((r) => ({ title: String(r.title || 'Recommendation'), rationale: String(r.rationale || ''), priority: allowed.has(r.priority) ? r.priority : 'medium', actions: Array.isArray(r.actions) ? r.actions.slice(0, 4).map(String) : [] })) : [];

    const { data: saved, error: saveError } = await supabase.from('ai_analyses').insert({ restaurant_id: restaurant.id, user_id: user.id, problem, diagnosis: result.diagnosis, root_causes: result.root_causes, recommendations: result.recommendations, priority: result.priority }).select('id,created_at').single();
    if (saveError) throw saveError;

    return json({ analysis_id: saved.id, created_at: saved.created_at, restaurant: { id: restaurant.id, name: restaurant.name }, ...result });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected advisor error.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
