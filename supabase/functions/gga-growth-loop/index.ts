import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, parseJson } from '../_shared/ai.ts';
import { evaluateStructuredOutput } from '../_shared/quality.ts';
import { selectModel } from '../_shared/router.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import type { AiTask } from '../_shared/ai.ts';

type Priority = 'low' | 'medium' | 'high' | 'critical';
type Plan = { diagnosis: string; root_causes: string[]; mission: { title: string; goal: string; priority: number; target_value: number | null; baseline_value: number | null; unit: string | null }; actions: Array<{ title: string; description: string; action_type: string; impact_score: number; effort_score: number; risk_level: 'low' | 'medium' | 'high' }> };

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401, corsHeaders);
    const origin = req.headers.get('Origin');
    const configuredOrigin = Deno.env.get('GGA_PUBLIC_URL')?.trim().replace(/\/$/, '') || 'https://gastrogrowthadvisor.com';
    if (origin && origin !== configuredOrigin) return json({ error: 'Origin not allowed' }, 403, corsHeaders);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: 'Supabase environment is incomplete' }, 500, corsHeaders);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Invalid session' }, 401, corsHeaders);

    const body = await req.json().catch(() => null);
    const problem = typeof body?.problem === 'string' ? body.problem.trim() : '';
    if (problem.length < 8 || problem.length > 4000) return json({ error: 'Problem must contain 8-4000 characters.' }, 400, corsHeaders);

    const { data: memberships, error: membershipError } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1);
    if (membershipError) throw membershipError;
    const organizationId = memberships?.[0]?.organization_id;
    if (!organizationId) return json({ error: 'No restaurant workspace found.' }, 404, corsHeaders);

    const { data: restaurant, error: restaurantError } = await supabase.from('restaurants').select('id,name,cuisine,city,country,website,price_segment,seats,average_ticket,target_customer,business_goals,current_problems,opening_hours').eq('organization_id', organizationId).limit(1).maybeSingle();
    if (restaurantError) throw restaurantError;
    if (!restaurant) return json({ error: 'Complete restaurant onboarding first.' }, 404, corsHeaders);

    const task: AiTask = 'advisor';
    const modelChoice = await selectModel(task, []);
    const ai = await callOpenRouter({ task, selectedModel: modelChoice.model, temperature: 0.15, system: `You are GGA's autonomous growth strategist. Analyze the restaurant problem and produce one coherent growth plan. Never invent business metrics. Missing numeric baselines or targets must be null. Prefer measurable goals and low-risk actions. Return JSON only with diagnosis, root_causes, mission and actions. diagnosis max 700 chars; root_causes 2-5; actions 2-5. mission priority 0-100. Every action requires title, description, action_type, impact_score 0-100, effort_score 0-100, risk_level low|medium|high.`, user: JSON.stringify({ restaurant, problem }) });

    const plan = normalizePlan(parseJson<Partial<Plan>>(ai.content));
    const quality = evaluateStructuredOutput(plan, { required: ['diagnosis', 'root_causes', 'mission', 'actions'], arrays: ['root_causes', 'actions'], minItems: { root_causes: 2, actions: 2 }, maxItems: { root_causes: 5, actions: 5 }, maxStringLength: { diagnosis: 700 } });
    if (quality.score < 75) return json({ error: 'AI plan failed quality gate', quality_score: quality.score }, 422, corsHeaders);

    const { data: analysis, error: analysisError } = await supabase.from('ai_analyses').insert({ restaurant_id: restaurant.id, user_id: user.id, problem, diagnosis: plan.diagnosis, root_causes: plan.root_causes, recommendations: plan.actions, priority: priorityFromNumber(plan.mission.priority) }).select('id').single();
    if (analysisError) throw analysisError;

    const { data: mission, error: missionError } = await supabase.from('growth_missions').insert({ restaurant_id: restaurant.id, title: plan.mission.title, goal: plan.mission.goal, target_value: plan.mission.target_value, baseline_value: plan.mission.baseline_value, unit: plan.mission.unit, priority: plan.mission.priority, status: 'draft', created_by: user.id, source_analysis_id: analysis.id, metadata: { quality_score: quality.score, model: ai.model, problem } }).select('id,title,status,priority').single();
    if (missionError) throw missionError;

    const { data: actions, error: actionsError } = await supabase.from('growth_actions').insert(plan.actions.map((action) => ({ mission_id: mission.id, restaurant_id: restaurant.id, ...action, status: 'proposed', created_by: user.id, metadata: { source: 'autonomous_growth_loop', quality_score: quality.score } }))).select('id,title,status,impact_score,effort_score,risk_level');
    if (actionsError) throw actionsError;

    const { error: eventError } = await supabase.from('growth_action_events').insert((actions ?? []).map((action) => ({ action_id: action.id, restaurant_id: restaurant.id, event_type: 'proposed', metadata: { mission_id: mission.id, source_analysis_id: analysis.id }, created_by: user.id })));
    if (eventError) console.error('Growth event error:', eventError);

    const { error: telemetryError } = await supabase.rpc('record_ai_run', { p_restaurant_id: restaurant.id, p_task: task, p_model: ai.model, p_attempts: ai.attempts, p_latency_ms: ai.latencyMs, p_prompt_tokens: ai.usage?.promptTokens ?? null, p_completion_tokens: ai.usage?.completionTokens ?? null, p_total_tokens: ai.usage?.totalTokens ?? null, p_success: true, p_quality_score: quality.score, p_metadata: { pipeline: 'growth-loop', analysis_id: analysis.id, mission_id: mission.id } });
    if (telemetryError) console.error('Growth telemetry error:', telemetryError);

    return json({ pipeline: 'observe-diagnose-plan-propose', analysis_id: analysis.id, mission, actions: actions ?? [], quality_score: quality.score, model: ai.model, next_step: 'customer_approval' }, 200, corsHeaders);
  } catch (error) {
    console.error('GGA growth loop error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected growth loop error.' }, 502, corsHeaders);
  }
});

function normalizePlan(input: Partial<Plan>): Plan {
  const mission = input.mission ?? {};
  const actions = Array.isArray(input.actions) ? input.actions : [];
  return { diagnosis: String(input.diagnosis || 'No diagnosis returned.').slice(0, 700), root_causes: Array.isArray(input.root_causes) ? input.root_causes.slice(0, 5).map(String) : [], mission: { title: String(mission.title || 'Growth Mission').slice(0, 160), goal: String(mission.goal || 'Improve restaurant growth').slice(0, 500), priority: clamp(mission.priority, 0, 100, 50), target_value: numberOrNull(mission.target_value), baseline_value: numberOrNull(mission.baseline_value), unit: mission.unit == null ? null : String(mission.unit).slice(0, 40) }, actions: actions.slice(0, 5).map((action) => ({ title: String(action?.title || 'Action').slice(0, 180), description: String(action?.description || '').slice(0, 1000), action_type: String(action?.action_type || 'recommendation').slice(0, 60), impact_score: clamp(action?.impact_score, 0, 100, 50), effort_score: clamp(action?.effort_score, 0, 100, 50), risk_level: action?.risk_level === 'high' || action?.risk_level === 'medium' ? action.risk_level : 'low' })) };
}
function numberOrNull(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
function clamp(value: unknown, min: number, max: number, fallback: number): number { const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback; return Math.max(min, Math.min(max, n)); }
function priorityFromNumber(value: number): Priority { if (value >= 90) return 'critical'; if (value >= 70) return 'high'; if (value >= 40) return 'medium'; return 'low'; }
function json(body: unknown, status: number, corsHeaders: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
