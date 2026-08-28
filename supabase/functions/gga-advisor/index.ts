import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, parseJson } from '../_shared/ai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Priority = 'low' | 'medium' | 'high' | 'critical';
type AdvisorResult = {
  diagnosis: string;
  root_causes: string[];
  recommendations: { title: string; rationale: string; priority: Priority; actions: string[] }[];
  priority: Priority;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: 'Supabase environment is incomplete' }, 500);

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

    const system = `You are GGA, Gastro Growth Advisor, a practical restaurant business strategist. Analyze the user's problem using the restaurant context. Never invent facts. Separate known context from assumptions. Prioritize actions by business impact and effort. Return JSON only with diagnosis, root_causes, recommendations and priority. diagnosis max 700 characters; root_causes 2-5 items; recommendations 2-4 items; each recommendation has title, rationale, priority (low|medium|high|critical) and 2-4 concrete actions. If information is missing, state the limitation or recommend collecting it.`;
    const ai = await callOpenRouter({
      task: 'advisor',
      system,
      user: JSON.stringify({ restaurant, user_problem: problem }),
      temperature: 0.2,
    });
    const parsed = normalizeAdvisorResult(parseJson<Partial<AdvisorResult>>(ai.content));

    const { data: saved, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({ restaurant_id: restaurant.id, user_id: user.id, problem, diagnosis: parsed.diagnosis, root_causes: parsed.root_causes, recommendations: parsed.recommendations, priority: parsed.priority })
      .select('id,created_at').single();
    if (saveError) throw saveError;

    return json({ analysis_id: saved.id, created_at: saved.created_at, restaurant: { id: restaurant.id, name: restaurant.name }, model: ai.model, latency_ms: ai.latencyMs, attempts: ai.attempts, ...parsed });
  } catch (error) {
    console.error('GGA advisor error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected advisor error.' }, 502);
  }
});

function normalizeAdvisorResult(input: Partial<AdvisorResult>): AdvisorResult {
  return {
    diagnosis: String(input.diagnosis || 'No diagnosis was returned.').slice(0, 700),
    root_causes: Array.isArray(input.root_causes) ? input.root_causes.slice(0, 5).map(String) : [],
    recommendations: Array.isArray(input.recommendations) ? input.recommendations.slice(0, 4).map((r) => ({
      title: String(r?.title || 'Recommendation').slice(0, 180),
      rationale: String(r?.rationale || '').slice(0, 1000),
      priority: normalizePriority(r?.priority),
      actions: Array.isArray(r?.actions) ? r.actions.slice(0, 4).map(String) : [],
    })) : [],
    priority: normalizePriority(input.priority),
  };
}

function normalizePriority(value: unknown): Priority {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical' ? value : 'medium';
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
