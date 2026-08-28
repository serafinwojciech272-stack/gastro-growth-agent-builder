import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, parseJson } from '../_shared/ai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Priority = 'low' | 'medium' | 'high' | 'critical';
type Recommendation = { title: string; rationale: string; priority: Priority; actions: string[] };
type Result = {
  score: number;
  summary: string;
  strengths: string[];
  issues: string[];
  opportunities: string[];
  recommendations: Recommendation[];
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !key) return json({ error: 'Supabase environment is incomplete' }, 500);

    const sb = createClient(url, key, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: 'Invalid session' }, 401);

    const body = await req.json();
    const menuId = typeof body?.menu_id === 'string' ? body.menu_id.trim() : '';
    if (!menuId) return json({ error: 'menu_id is required' }, 400);

    const { data: menu, error: menuError } = await sb
      .from('menus').select('id,restaurant_id,name').eq('id', menuId).single();
    if (menuError || !menu) return json({ error: 'Menu not found' }, 404);

    const { data: items, error: itemError } = await sb
      .from('menu_items')
      .select('category,name,description,price,cost,position')
      .eq('menu_id', menuId)
      .order('position');
    if (itemError) throw itemError;
    if (!items?.length) return json({ error: 'Menu has no items' }, 400);

    const { data: restaurant, error: restaurantError } = await sb
      .from('restaurants')
      .select('name,cuisine,city,country,price_segment,seats,average_ticket,target_customer,business_goals,current_problems')
      .eq('id', menu.restaurant_id).single();
    if (restaurantError) throw restaurantError;

    const { data: member, error: memberError } = await sb
      .from('organization_members').select('organization_id').eq('user_id', user.id).limit(1).single();
    if (memberError || !member) return json({ error: 'Workspace access denied' }, 403);

    const system = `You are GGA Menu Intelligence, a senior restaurant menu engineer. Analyze only supplied data. Never invent sales, margin or popularity data. If evidence is missing, state the limitation. Evaluate pricing architecture, descriptions, category balance, perceived value, upsell/cross-sell opportunities and obvious menu engineering issues. Return JSON only with score 0-100, summary, strengths, issues, opportunities and recommendations. Give 2-5 strengths, 2-6 issues, 2-6 opportunities and 2-5 recommendations. Each recommendation needs title, rationale, priority (low|medium|high|critical) and 2-4 concrete actions.`;
    const ai = await callOpenRouter({
      task: 'menu',
      system,
      user: JSON.stringify({ restaurant, menu, items }),
      temperature: 0.15,
    });
    const result = normalizeResult(parseJson<Partial<Result>>(ai.content));

    const { error: menuUpdateError } = await sb
      .from('menus').update({ status: 'analyzed', updated_at: new Date().toISOString() }).eq('id', menuId);
    if (menuUpdateError) throw menuUpdateError;

    const { data: saved, error: saveError } = await sb
      .from('menu_analyses')
      .insert({
        menu_id: menuId,
        restaurant_id: menu.restaurant_id,
        user_id: user.id,
        score: result.score,
        summary: result.summary,
        strengths: result.strengths,
        issues: result.issues,
        opportunities: result.opportunities,
        recommendations: result.recommendations,
      })
      .select('id,created_at').single();
    if (saveError) throw saveError;

    return json({ analysis_id: saved.id, created_at: saved.created_at, model: ai.model, latency_ms: ai.latencyMs, attempts: ai.attempts, ...result });
  } catch (error) {
    console.error('GGA menu analysis error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected menu analysis error.' }, 502);
  }
});

function normalizeResult(input: Partial<Result>): Result {
  const allowed = new Set<Priority>(['low', 'medium', 'high', 'critical']);
  const recommendations = Array.isArray(input.recommendations)
    ? input.recommendations.slice(0, 5).map((r) => ({
        title: String(r?.title || 'Recommendation').slice(0, 180),
        rationale: String(r?.rationale || '').slice(0, 1000),
        priority: allowed.has(r?.priority as Priority) ? r!.priority as Priority : 'medium',
        actions: Array.isArray(r?.actions) ? r!.actions.slice(0, 4).map(String) : [],
      }))
    : [];
  return {
    score: Math.max(0, Math.min(100, Number(input.score) || 50)),
    summary: String(input.summary || '').slice(0, 2000),
    strengths: Array.isArray(input.strengths) ? input.strengths.slice(0, 5).map(String) : [],
    issues: Array.isArray(input.issues) ? input.issues.slice(0, 6).map(String) : [],
    opportunities: Array.isArray(input.opportunities) ? input.opportunities.slice(0, 6).map(String) : [],
    recommendations,
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
