import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, parseJson } from '../_shared/ai.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

const headersFor = (req: Request) => ({ ...getCorsHeaders(req), 'Content-Type': 'application/json' });

type ReviewInput = { rating?: number; review_text?: string; source?: string };
type ReviewResult = { summary: string; sentiment_breakdown: { positive: number; neutral: number; negative: number }; recurring_issues: { issue: string; frequency: number; severity: 'low' | 'medium' | 'high'; evidence: string }[]; strengths: { strength: string; frequency: number }[]; recommendations: { priority: 'high' | 'medium' | 'low'; recommendation: string; reason: string; action: string }[] };

Deno.serve(async (req) => {
  const cors = headersFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
  try {
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401, cors);
    const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !key) return json({ error: 'Supabase environment is incomplete' }, 500, cors);
    const supabase = createClient(url, key, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401, cors);
    const body = await req.json().catch(() => null);
    const restaurantId = typeof body?.restaurantId === 'string' ? body.restaurantId.trim() : '';
    const reviews = Array.isArray(body?.reviews) ? body.reviews as ReviewInput[] : [];
    if (!restaurantId || reviews.length === 0) return json({ error: 'restaurantId and reviews are required' }, 400, cors);
    const { data: restaurant, error: restaurantError } = await supabase.from('restaurants').select('id,name,cuisine,city,country,website,average_ticket,target_customer,business_goals,current_problems').eq('id', restaurantId).single();
    if (restaurantError) throw restaurantError;
    const allowed = reviews.slice(0, 100).map((r) => ({ rating: typeof r?.rating === 'number' ? Math.max(1, Math.min(5, r.rating)) : null, review_text: String(r?.review_text ?? '').slice(0, 2000), source: String(r?.source ?? 'manual').slice(0, 80) }));
    const system = `You are Gastro Growth Advisor Review Intelligence. Analyze only supplied restaurant and review data. Never invent facts. Base frequencies only on supplied reviews. Return JSON only with summary, sentiment_breakdown, recurring_issues, strengths and recommendations. sentiment_breakdown must contain positive, neutral and negative integer counts. recurring_issues contain issue, frequency, severity (low|medium|high), evidence. strengths contain strength and frequency. recommendations contain priority (high|medium|low), recommendation, reason and action.`;
    const ai = await callOpenRouter({ task: 'reviews', system, user: JSON.stringify({ restaurant, reviews: allowed }), temperature: 0.2 });
    const result = normalizeResult(parseJson<Partial<ReviewResult>>(ai.content));
    const { data: analysis, error } = await supabase.from('review_analyses').insert({ restaurant_id: restaurantId, summary: result.summary, sentiment_breakdown: result.sentiment_breakdown, recurring_issues: result.recurring_issues, strengths: result.strengths, recommendations: result.recommendations, raw_result: result, created_by: user.id }).select().single();
    if (error) throw error;
    return json({ analysis, model: ai.model, latency_ms: ai.latencyMs, attempts: ai.attempts }, 200, cors);
  } catch (error) {
    console.error('GGA review analysis error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected review analysis error.' }, 502, cors);
  }
});
function normalizeResult(input: Partial<ReviewResult>): ReviewResult { const sentiment = input.sentiment_breakdown ?? { positive: 0, neutral: 0, negative: 0 }; const severity = new Set(['low', 'medium', 'high']); const priority = new Set(['high', 'medium', 'low']); return { summary: String(input.summary || '').slice(0, 3000), sentiment_breakdown: { positive: Math.max(0, Math.round(Number(sentiment.positive) || 0)), neutral: Math.max(0, Math.round(Number(sentiment.neutral) || 0)), negative: Math.max(0, Math.round(Number(sentiment.negative) || 0)) }, recurring_issues: Array.isArray(input.recurring_issues) ? input.recurring_issues.slice(0, 10).map((r) => ({ issue: String(r?.issue || '').slice(0, 300), frequency: Math.max(0, Math.round(Number(r?.frequency) || 0)), severity: severity.has(r?.severity) ? r!.severity : 'medium', evidence: String(r?.evidence || '').slice(0, 600) })) : [], strengths: Array.isArray(input.strengths) ? input.strengths.slice(0, 10).map((r) => ({ strength: String(r?.strength || '').slice(0, 300), frequency: Math.max(0, Math.round(Number(r?.frequency) || 0)) })) : [], recommendations: Array.isArray(input.recommendations) ? input.recommendations.slice(0, 8).map((r) => ({ priority: priority.has(r?.priority) ? r!.priority : 'medium', recommendation: String(r?.recommendation || '').slice(0, 500), reason: String(r?.reason || '').slice(0, 700), action: String(r?.action || '').slice(0, 700) })) : [] }; }
function json(body: unknown, status: number, cors: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: cors }); }
