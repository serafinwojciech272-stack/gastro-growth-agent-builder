import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter } from '../_shared/ai.ts';
import { evaluateStructuredOutput } from '../_shared/quality.ts';
import { selectModel } from '../_shared/router.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import type { AiTask } from '../_shared/ai.ts';

type Priority = 'low' | 'medium' | 'high' | 'critical';
type Plan = {
  diagnosis: string;
  root_causes: string[];
  mission: { title: string; goal: string; priority: number; target_value: number | null; baseline_value: number | null; unit: string | null };
  actions: Array<{ title: string; description: string; action_type: string; impact_score: number; effort_score: number; risk_level: 'low' | 'medium' | 'high' }>;
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401, corsHeaders);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: 'Supabase environment is incomplete' }, 500, corsHeaders);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: 'Invalid session' }, 401, corsHeaders);

    const body = await req.json().catch(() => null);
    const problem = typeof body?.problem === 'string' ? body.problem.trim() : '';
    if (problem.length < 8 || problem.length > 4000) return json({ error: 'Problem must contain 8-4000 characters.' }, 400, corsHeaders);

    const { data: memberships, error: membershipError } = await userClient.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1);
    if (membershipError) throw membershipError;
    const organizationId = memberships?.[0]?.organization_id;
    if (!organizationId) return json({ error: 'No business workspace found.' }, 404, corsHeaders);

    const { data: restaurant, error: restaurantError } = await userClient.from('restaurants').select('id,name,cuisine,city,country,website,price_segment,seats,average_ticket,target_customer,business_goals,current_problems,opening_hours,business_profile_id').eq('organization_id', organizationId).limit(1).maybeSingle();
    if (restaurantError) throw restaurantError;
    if (!restaurant) return json({ error: 'Complete business onboarding first.' }, 404, corsHeaders);
    if (!restaurant.business_profile_id) return json({ error: 'Business profile is not initialized. Complete onboarding before creating a mission.' }, 409, corsHeaders);

    const task: AiTask = 'advisor';
    const modelChoice = await selectModel(task, []);
    const ai = await callOpenRouter({
      task,
      selectedModel: modelChoice.model,
      temperature: 0.15,
      system: `You are GA's governed growth strategist. Analyze the business problem and produce one coherent growth plan. Never invent business metrics. Missing numeric baselines or targets must be null. Separate facts from assumptions in the diagnosis. Prefer measurable goals and low-risk actions. Return JSON only with diagnosis, root_causes, mission and actions. diagnosis max 700 chars; root_causes 2-5; actions 2-5. mission priority 0-100. Every action requires title, description, action_type, impact_score 0-100, effort_score 0-100, risk_level low|medium|high.`,
      user: JSON.stringify({ business: restaurant, problem }),
    });

    const plan = normalizePlan(parseJson(ai.content));
    const quality = evaluateStructuredOutput(plan, { required: ['diagnosis', 'root_causes', 'mission', 'actions'], arrays: ['root_causes', 'actions'], minItems: { root_causes: 2, actions: 2 }, maxItems: { root_causes: 5, actions: 5 }, maxStringLength: { diagnosis: 700 } });
    if (quality.score < 75) return json({ error: 'AI plan failed quality gate', quality_score: quality.score }, 422, corsHeaders);

    const { data: analysis, error: analysisError } = await adminClient.from('ai_analyses').insert({ restaurant_id: restaurant.id, user_id: user.id, problem, diagnosis: plan.diagnosis, root_causes: plan.root_causes, recommendations: plan.actions, priority: priorityFromNumber(plan.mission.priority) }).select('id,created_at').single();
    if (analysisError) throw analysisError;

    const missionId = crypto.randomUUID();
    const decision = {
      decision_type: 'growth_mission_proposal',
      selected_opportunity: plan.mission.title,
      rationale: plan.diagnosis,
      confidence: quality.score,
      requires_approval: true,
      source_analysis_id: analysis.id,
    };
    const missionJson = {
      title: plan.mission.title,
      goal: plan.mission.goal,
      priority: plan.mission.priority,
      target_value: plan.mission.target_value,
      baseline_value: plan.mission.baseline_value,
      unit: plan.mission.unit,
      actions: plan.actions.map((action) => ({ title: action.title, action_type: action.action_type })),
      expected_outcome: plan.mission.goal,
    };
    const diagnosisJson = {
      problem,
      diagnosis: plan.diagnosis,
      root_causes: plan.root_causes,
      evidence: [{ type: 'human_input', observation: problem, epistemic_status: 'fact' }],
      quality_score: quality.score,
      model: ai.model,
    };

    const { data: mission, error: missionError } = await adminClient.from('growth_mission_runs').insert({
      id: missionId,
      business_id: restaurant.business_profile_id,
      requested_by_user_id: user.id,
      status: 'awaiting_approval',
      engine_version: 'growth-loop-v2',
      diagnosis_json: diagnosisJson,
      decision_json: decision,
      mission_json: missionJson,
    }).select('id,business_id,status,engine_version,created_at').single();
    if (missionError) throw missionError;

    const actionRows = plan.actions.map((action) => ({
      restaurant_id: restaurant.id,
      recommendation_id: null,
      action_type: action.action_type,
      title: action.title,
      description: action.description,
      status: 'todo',
      priority: priorityFromNumber(action.impact_score),
      payload: { mission_id: mission.id, impact_score: action.impact_score, effort_score: action.effort_score, risk_level: action.risk_level, source_analysis_id: analysis.id },
      result: {},
      created_by: user.id,
    }));
    const { data: actions, error: actionsError } = await adminClient.from('actions').insert(actionRows).select('id,restaurant_id,action_type,title,description,status,priority,payload,created_at');
    if (actionsError) throw actionsError;

    const { error: telemetryError } = await adminClient.rpc('record_ai_run', { p_restaurant_id: restaurant.id, p_task: task, p_model: ai.model, p_attempts: ai.attempts, p_latency_ms: ai.latencyMs, p_prompt_tokens: ai.usage?.promptTokens ?? null, p_completion_tokens: ai.usage?.completionTokens ?? null, p_total_tokens: ai.usage?.totalTokens ?? null, p_success: true, p_quality_score: quality.score, p_metadata: { pipeline: 'governed-growth-loop', analysis_id: analysis.id, mission_id: mission.id } });
    if (telemetryError) console.error('Growth telemetry error:', telemetryError);

    return json({ pipeline: 'observe-diagnose-decide-propose', analysis_id: analysis.id, mission, actions: actions ?? [], quality_score: quality.score, model: ai.model, next_step: 'customer_approval' }, 200, corsHeaders);
  } catch (error) {
    console.error('GA growth loop error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected growth loop error.' }, 502, corsHeaders);
  }
});

function parseJson<T = Record<string, unknown>>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned) as T; } catch { const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}'); if (start < 0 || end <= start) throw new Error('AI returned invalid structured data'); return JSON.parse(cleaned.slice(start, end + 1)) as T; }
}
function normalizePlan(input: Partial<Plan>): Plan { const mission = input.mission ?? {}; const actions = Array.isArray(input.actions) ? input.actions : []; return { diagnosis: String(input.diagnosis || 'No diagnosis returned.').slice(0, 700), root_causes: Array.isArray(input.root_causes) ? input.root_causes.slice(0, 5).map(String) : [], mission: { title: String(mission.title || 'Growth Mission').slice(0, 160), goal: String(mission.goal || 'Improve business growth').slice(0, 500), priority: clamp(mission.priority, 0, 100, 50), target_value: numberOrNull(mission.target_value), baseline_value: numberOrNull(mission.baseline_value), unit: mission.unit == null ? null : String(mission.unit).slice(0, 40) }, actions: actions.slice(0, 5).map((action) => ({ title: String(action?.title || 'Action').slice(0, 180), description: String(action?.description || '').slice(0, 1000), action_type: String(action?.action_type || 'recommendation').slice(0, 60), impact_score: clamp(action?.impact_score, 0, 100, 50), effort_score: clamp(action?.effort_score, 0, 100, 50), risk_level: action?.risk_level === 'high' || action?.risk_level === 'medium' ? action.risk_level : 'low' })) }; }
function numberOrNull(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
function clamp(value: unknown, min: number, max: number, fallback: number): number { const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback; return Math.max(min, Math.min(max, n)); }
function priorityFromNumber(value: number): Priority { if (value >= 90) return 'critical'; if (value >= 70) return 'high'; if (value >= 40) return 'medium'; return 'low'; }
function json(body: unknown, status: number, corsHeaders: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
