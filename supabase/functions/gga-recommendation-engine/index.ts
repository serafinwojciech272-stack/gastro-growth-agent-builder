import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, parseJson } from '../_shared/ai.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

type Recommendation = {
  source_type: 'advisor' | 'menu' | 'reviews' | 'marketing' | 'competitor' | 'seo' | 'analytics';
  title: string;
  problem: string | null;
  rationale: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expected_impact: string | null;
  confidence: number;
  action_payload: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const restaurantId = typeof body?.restaurantId === 'string' ? body.restaurantId.trim() : '';
    if (!restaurantId) return json({ error: 'restaurantId is required' }, 400);

    const [{ data: restaurant, error: restaurantError }, { data: advisor }, { data: menu }, { data: reviews }] = await Promise.all([
      supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
      supabase.from('ai_analyses').select('id,diagnosis,root_causes,recommendations,priority,created_at').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(3),
      supabase.from('menu_analyses').select('id,score,strengths,issues,opportunities,recommendations,created_at').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(3),
      supabase.from('review_analyses').select('id,summary,sentiment_breakdown,recurring_issues,strengths,recommendations,created_at').eq('restaurant_id', restaurantId).order('created_at', { ascending: false }).limit(3),
    ]);
    if (restaurantError) throw restaurantError;

    const system = `You are the GGA Recommendation Engine. Synthesize existing restaurant intelligence into a prioritized action backlog. Never invent metrics, facts, competitors or customer behavior. Prefer evidence-backed actions. Deduplicate overlapping recommendations. Return JSON only: {"recommendations":[{"source_type":"advisor|menu|reviews|marketing|competitor|seo|analytics","title":string,"problem":string|null,"rationale":string|null,"priority":"critical|high|medium|low","expected_impact":string|null,"confidence":number,"action_payload":object}]}. Confidence must be 0-1. Return at most 20 recommendations.`;
    const ai = await callOpenRouter({
      task: 'recommendations',
      system,
      user: JSON.stringify({ restaurant, advisor: advisor ?? [], menu: menu ?? [], reviews: reviews ?? [] }),
      temperature: 0.15,
    });
    const parsed = parseJson<{ recommendations?: Partial<Recommendation>[] }>(ai.content);
    const rows = normalizeRecommendations(parsed.recommendations ?? []).map((r) => ({
      restaurant_id: restaurantId,
      ...r,
      created_by: user.id,
    }));

    if (rows.length) {
      const { error } = await supabase.from('recommendations').insert(rows);
      if (error) throw error;
    }

    return json({ count: rows.length, recommendations: rows, model: ai.model, latency_ms: ai.latencyMs, attempts: ai.attempts });
  } catch (error) {
    console.error('GGA recommendation engine error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected recommendation error.' }, 502);
  }
});

function normalizeRecommendations(items: Partial<Recommendation>[]): Recommendation[] {
  const sourceTypes = new Set<Recommendation['source_type']>(['advisor', 'menu', 'reviews', 'marketing', 'competitor', 'seo', 'analytics']);
  const priorities = new Set<Recommendation['priority']>(['critical', 'high', 'medium', 'low']);
  const seen = new Set<string>();
  const output: Recommendation[] = [];

  for (const item of items.slice(0, 20)) {
    const title = String(item?.title || 'Untitled recommendation').trim().slice(0, 180);
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      source_type: sourceTypes.has(item?.source_type as Recommendation['source_type']) ? item!.source_type as Recommendation['source_type'] : 'advisor',
      title,
      problem: item?.problem ? String(item.problem).slice(0, 800) : null,
      rationale: item?.rationale ? String(item.rationale).slice(0, 1200) : null,
      priority: priorities.has(item?.priority as Recommendation['priority']) ? item!.priority as Recommendation['priority'] : 'medium',
      expected_impact: item?.expected_impact ? String(item.expected_impact).slice(0, 500) : null,
      confidence: Math.max(0, Math.min(1, Number(item?.confidence) || 0)),
      action_payload: item?.action_payload && typeof item.action_payload === 'object' && !Array.isArray(item.action_payload)
        ? item.action_payload as Record<string, unknown>
        : {},
    });
  }
  return output;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}
