import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter } from './_shared/ai.ts';
import { evaluateStructuredOutput } from './_shared/quality.ts';
import { selectModel } from './_shared/router.ts';
import { getCorsHeaders } from './_shared/cors.ts';
import type { AiTask } from './_shared/ai.ts';

type Priority = 'low' | 'medium' | 'high' | 'critical';
type AdaptiveAdjustment = {
  applied: boolean;
  source_mission_id: string | null;
  reason: string;
  adjustments: { priority_delta: number; target_value: number | null; baseline_value: number | null; action_bias: 'retain' | 'change' | 'reduce_risk' };
  confidence: number;
};

type Prediction = {
  horizon: string;
  predicted_outcome: string;
  baseline: number | null;
  target: number | null;
  expected_value: number | null;
  unit: string | null;
  probability_of_success: number;
  confidence: number;
  risk_level: 'low' | 'medium' | 'high';
  key_assumptions: string[];
  leading_indicators: string[];
  failure_conditions: string[];
};
type Plan = {
  diagnosis: string;
  root_causes: string[];
  mission: { title: string; goal: string; priority: number; target_value: number | null; baseline_value: number | null; unit: string | null };
  prediction: Prediction;
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
    const source = typeof body?.source === 'string' ? body.source : 'direct';
    const sourceProjectId = typeof body?.source_project_id === 'string' ? body.source_project_id : null;
    const websiteContext = body?.website_context && typeof body.website_context === 'object' ? body.website_context : null;
    if (problem.length < 8 || problem.length > 4000) return json({ error: 'Problem must contain 8-4000 characters.' }, 400, corsHeaders);

    const { data: memberships, error: membershipError } = await userClient.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1);
    if (membershipError) throw membershipError;
    const organizationId = memberships?.[0]?.organization_id;
    if (!organizationId) return json({ error: 'No business workspace found.' }, 404, corsHeaders);

    const { data: restaurant, error: restaurantError } = await userClient.from('restaurants').select('id,name,cuisine,city,country,website,price_segment,seats,average_ticket,target_customer,business_goals,current_problems,opening_hours,business_profile_id').eq('organization_id', organizationId).limit(1).maybeSingle();
    if (restaurantError) throw restaurantError;
    if (!restaurant) return json({ error: 'Complete business onboarding first.' }, 404, corsHeaders);
    if (!restaurant.business_profile_id) return json({ error: 'Business profile is not initialized. Complete onboarding before creating a mission.' }, 409, corsHeaders);

    // M9.3 Learning Loop: retrieve prior measured outcomes for this business before making the next decision.
    const { data: priorMissions, error: priorMissionError } = await adminClient
      .from('growth_mission_runs')
      .select('id,status,mission_json,created_at,updated_at')
      .eq('business_id', restaurant.business_profile_id)
      .order('created_at', { ascending: false })
      .limit(12);
    if (priorMissionError) throw priorMissionError;

    const priorIds = (priorMissions ?? []).map((row) => row.id);
    let priorOutcomes: Array<Record<string, unknown>> = [];
    if (priorIds.length > 0) {
      const { data: outcomes, error: outcomesError } = await adminClient
        .from('growth_outcomes')
        .select('mission_id,status,metrics_before,metrics_after,summary,learning,confidence,learning_json,updated_at')
        .in('mission_id', priorIds)
        .order('updated_at', { ascending: false })
        .limit(12);
      if (outcomesError) throw outcomesError;
      priorOutcomes = outcomes ?? [];
    }

    const learningContext = priorOutcomes.slice(0, 8).map((outcome) => {
      const mission = (priorMissions ?? []).find((item) => item.id === outcome.mission_id);
      return {
        mission_id: outcome.mission_id,
        mission_title: mission?.mission_json?.title ?? null,
        mission_goal: mission?.mission_json?.goal ?? null,
        status: outcome.status,
        metrics_before: outcome.metrics_before,
        metrics_after: outcome.metrics_after,
        summary: outcome.summary,
        learning: outcome.learning,
        confidence: outcome.confidence,
        learning_json: compactLearningJson(outcome.learning_json),
        updated_at: outcome.updated_at,
      };
    });

    // M9.5 Self-Evaluation: score the intelligence of the previous governed cycle
    // from observable evidence only. Missing evidence remains unevaluated.
    const priorSelfEvaluation = deriveSelfEvaluation(learningContext);

    // M9.4 Adaptive Decision Loop: derive bounded adjustments from measured learning.
    const adaptiveAdjustment = deriveAdaptiveAdjustment(learningContext);

    if (sourceProjectId) {
      const { data: existing } = await adminClient.from('growth_mission_runs').select('id,business_id,status,engine_version,created_at,diagnosis_json,decision_json,mission_json').eq('business_id', restaurant.business_profile_id).contains('mission_json', { source_project_id: sourceProjectId }).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (existing) return json({ pipeline: 'observe-diagnose-decide-propose', mission: existing, reused: true, next_step: existing.status === 'awaiting_approval' ? 'customer_approval' : 'existing_mission' }, 200, corsHeaders);
    }

    const task: AiTask = 'advisor';
    const modelChoice = await selectModel(task, []);
    const ai = await callOpenRouter({
      task,
      selectedModel: modelChoice.model,
      temperature: 0.15,
      system: `You are GA's governed growth strategist and predictive decision engine. Analyze the business problem and produce one coherent growth plan. Never invent business metrics. Missing numeric baselines, targets or expected values must be null. Separate facts from assumptions. Prediction is not a fact: explicitly expose assumptions, uncertainty and failure conditions. Never assign high confidence when evidence is weak. Prefer measurable goals and low-risk actions. Return JSON only with diagnosis, root_causes, mission, prediction and actions. diagnosis max 700 chars; root_causes 2-5; actions 2-5. mission priority 0-100. prediction must contain horizon, predicted_outcome, baseline, target, expected_value, unit, probability_of_success 0-1, confidence 0-1, risk_level low|medium|high, key_assumptions 1-5, leading_indicators 1-5, failure_conditions 1-5. Every action requires title, description, action_type, impact_score 0-100, effort_score 0-100, risk_level low|medium|high.`,
      user: JSON.stringify({
        business: restaurant,
        problem,
        source,
        source_project_id: sourceProjectId,
        website_context: websiteContext,
        learning_context: learningContext,
        adaptive_adjustment: adaptiveAdjustment,
        self_evaluation: priorSelfEvaluation,
      }),
    });

    const plan = normalizePlan(parseJson(ai.content));
    const prediction = calibratePrediction(plan.prediction, plan.mission, qualitySafeNumber(ai.usage?.totalTokens));
    const quality = evaluateStructuredOutput(plan, { required: ['diagnosis', 'root_causes', 'mission', 'prediction', 'actions'], arrays: ['root_causes', 'actions'], minItems: { root_causes: 2, actions: 2 }, maxItems: { root_causes: 5, actions: 5 }, maxStringLength: { diagnosis: 700 } });
    if (quality.score < 75) return json({ error: 'AI plan failed quality gate', quality_score: quality.score }, 422, corsHeaders);

    const selfEvaluation = finalizeSelfEvaluation(priorSelfEvaluation, quality.score, adaptiveAdjustment);

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
      source,
      source_project_id: sourceProjectId,
      learning_context: learningContext,
      adaptive_adjustment: adaptiveAdjustment,
      self_evaluation: selfEvaluation,
      prediction,
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
      source,
      source_project_id: sourceProjectId,
      learning_context: learningContext,
      adaptive_adjustment: adaptiveAdjustment,
      self_evaluation: selfEvaluation,
      prediction,
    };
    const diagnosisJson = {
      problem,
      diagnosis: plan.diagnosis,
      root_causes: plan.root_causes,
      evidence: [{ type: 'human_input', observation: problem, epistemic_status: 'fact' }, ...(websiteContext ? [{ type: 'website_builder', observation: websiteContext, epistemic_status: 'derived_context' }] : [])],
      quality_score: quality.score,
      model: ai.model,
      source,
      source_project_id: sourceProjectId,
      learning_context: learningContext,
      adaptive_adjustment: adaptiveAdjustment,
      self_evaluation: selfEvaluation,
      prediction,
    };

    const { data: mission, error: missionError } = await adminClient.from('growth_mission_runs').insert({
      id: missionId,
      business_id: restaurant.business_profile_id,
      requested_by_user_id: user.id,
      status: 'awaiting_approval',
      engine_version: 'growth-loop-v4',
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

    const { error: telemetryError } = await adminClient.rpc('record_ai_run', { p_restaurant_id: restaurant.id, p_task: task, p_model: ai.model, p_attempts: ai.attempts, p_latency_ms: ai.latencyMs, p_prompt_tokens: ai.usage?.promptTokens ?? null, p_completion_tokens: ai.usage?.completionTokens ?? null, p_total_tokens: ai.usage?.totalTokens ?? null, p_success: true, p_quality_score: quality.score, p_metadata: { pipeline: 'governed-growth-loop', analysis_id: analysis.id, mission_id: mission.id, prediction: { probability_of_success: prediction.probability_of_success, confidence: prediction.confidence, risk_level: prediction.risk_level, horizon: prediction.horizon } } });
    if (telemetryError) console.error('Growth telemetry error:', telemetryError);

    return json({ pipeline: 'observe-diagnose-decide-propose', analysis_id: analysis.id, mission, actions: actions ?? [], quality_score: quality.score, model: ai.model, next_step: 'customer_approval' }, 200, corsHeaders);
  } catch (error) {
    console.error('GA growth loop error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected growth loop error.' }, 502, corsHeaders);
  }
});

type SelfEvaluation = {
  version: 'm9.5';
  status: 'complete' | 'partial' | 'insufficient_evidence';
  intelligence_score: number | null;
  evidence_coverage: number;
  dimensions: {
    diagnosis_quality: number | null;
    decision_quality: number | null;
    execution_quality: number | null;
    measurement_quality: number | null;
    learning_quality: number | null;
  };
  strengths: string[];
  weaknesses: string[];
  next_focus: string[];
  provenance: { source_mission_ids: string[]; basis: string[] };
  confidence: number;
};

function compactLearningJson(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const v = value as Record<string, unknown>;
  return {
    target_value: typeof v.target_value === 'number' ? v.target_value : null,
    target_direction: typeof v.target_direction === 'string' ? v.target_direction : null,
    baseline_value: typeof v.baseline_value === 'number' ? v.baseline_value : null,
    observed_value: typeof v.observed_value === 'number' ? v.observed_value : null,
    delta: typeof v.delta === 'number' ? v.delta : null,
    delta_pct: typeof v.delta_pct === 'number' ? v.delta_pct : null,
    target_status: typeof v.target_status === 'string' ? v.target_status : null,
    lesson_type: typeof v.lesson_type === 'string' ? v.lesson_type : null,
    quality: typeof v.quality === 'string' ? v.quality : null,
  };
}

function deriveSelfEvaluation(context: Array<Record<string, unknown>>): SelfEvaluation {
  const recent = context.slice(0, 5);
  const ids = recent.map((x) => String(x.mission_id)).filter(Boolean);
  const executionScores: number[] = [];
  const measurementScores: number[] = [];
  const learningScores: number[] = [];
  for (const item of recent) {
    const lj = item.learning_json && typeof item.learning_json === 'object' ? item.learning_json as Record<string, unknown> : {};
    const metricsAfter = item.metrics_after && typeof item.metrics_after === 'object' ? item.metrics_after as Record<string, unknown> : {};
    if (typeof metricsAfter.completed === 'number' && typeof metricsAfter.action_count === 'number' && metricsAfter.action_count > 0) {
      executionScores.push(Math.round((metricsAfter.completed / metricsAfter.action_count) * 100));
    }
    if (typeof lj.quality === 'string') measurementScores.push(lj.quality === 'VERIFIED' ? 100 : lj.quality === 'PARTIAL' ? 60 : 25);
    if (typeof item.confidence === 'number') learningScores.push(Math.round(Math.max(0, Math.min(1, item.confidence)) * 100));
  }
  const avg=(xs:number[])=>xs.length?Math.round(xs.reduce((a,b)=>a+b,0)/xs.length):null;
  const dimensions = {
    diagnosis_quality: null as number|null,
    decision_quality: null as number|null,
    execution_quality: avg(executionScores),
    measurement_quality: avg(measurementScores),
    learning_quality: avg(learningScores),
  };
  const available=[dimensions.execution_quality,dimensions.measurement_quality,dimensions.learning_quality].filter((x):x is number=>x!==null);
  const score=available.length?Math.round(available.reduce((a,b)=>a+b,0)/available.length):null;
  const coverage=available.length/5;
  const strengths:string[]=[];
  const weaknesses:string[]=[];
  if ((dimensions.execution_quality??0)>=80) strengths.push('Governed execution completed a high share of recorded actions.');
  if (dimensions.measurement_quality===100) strengths.push('Outcome measurement has verified KPI evidence.');
  if ((dimensions.learning_quality??0)>=75) strengths.push('Learning confidence is sufficiently strong for bounded adaptation.');
  if (dimensions.execution_quality!==null && dimensions.execution_quality<80) weaknesses.push('Execution evidence shows incomplete action completion.');
  if (dimensions.measurement_quality!==null && dimensions.measurement_quality<100) weaknesses.push('Measurement evidence is partial or unverified.');
  if (dimensions.learning_quality!==null && dimensions.learning_quality<75) weaknesses.push('Learning confidence is below the adaptive threshold.');
  const nextFocus:string[]=[];
  if (dimensions.measurement_quality===null || dimensions.measurement_quality<100) nextFocus.push('Collect verified KPI evidence before stronger adaptation.');
  if (dimensions.execution_quality===null) nextFocus.push('Record action-level execution telemetry.');
  if (dimensions.learning_quality===null || dimensions.learning_quality<75) nextFocus.push('Increase evidence quality before changing strategy.');
  return {
    version:'m9.5',
    status:available.length>=3?'complete':available.length>0?'partial':'insufficient_evidence',
    intelligence_score:score,
    evidence_coverage:coverage,
    dimensions,
    strengths,
    weaknesses,
    next_focus:nextFocus,
    provenance:{source_mission_ids:ids,basis:['growth_outcomes.metrics_after','growth_outcomes.learning_json','growth_outcomes.confidence']},
    confidence:score===null?0.25:Math.min(0.95,0.45+(coverage*0.5)),
  };
}

function finalizeSelfEvaluation(base: SelfEvaluation, diagnosisQuality: number, adaptive: AdaptiveAdjustment): SelfEvaluation {
  const dimensions={...base.dimensions,diagnosis_quality:Math.round(diagnosisQuality),decision_quality:Math.round((diagnosisQuality + adaptive.confidence*100)/2)};
  const available=Object.values(dimensions).filter((x):x is number=>typeof x==='number');
  const score=available.length?Math.round(available.reduce((a,b)=>a+b,0)/available.length):null;
  const weaknesses=[...base.weaknesses];
  if (diagnosisQuality<85) weaknesses.push('Current AI diagnosis did not reach the internal 85/100 quality target.');
  const nextFocus=[...base.next_focus];
  if (adaptive.applied) nextFocus.push('Validate whether the adaptive adjustment improves the next measured outcome.');
  return {...base,status:available.length>=5?'complete':'partial',intelligence_score:score,evidence_coverage:available.length/5,dimensions,weaknesses:[...new Set(weaknesses)].slice(0,5),next_focus:[...new Set(nextFocus)].slice(0,5),confidence:Math.min(0.95,Math.max(base.confidence,0.5+available.length*0.1))};
}

function deriveAdaptiveAdjustment(context: Array<Record<string, unknown>>): AdaptiveAdjustment {
  const verified = context
    .filter((item) => item?.confidence != null && Number(item.confidence) >= 0.75)
    .map((item) => ({ ...item, learning: item.learning_json && typeof item.learning_json === 'object' ? item.learning_json as Record<string, unknown> : {} }))
    .slice(0, 5);
  const latest = verified[0];
  if (!latest) {
    return {
      applied: false,
      source_mission_id: null,
      reason: 'No sufficiently confident prior outcome is available for adaptive adjustment.',
      adjustments: { priority_delta: 0, target_value: null, baseline_value: null, action_bias: 'retain' },
      confidence: 0.35,
    };
  }
  const learning = latest.learning as Record<string, unknown>;
  const status = String(learning.target_status ?? '').toLowerCase();
  const lesson = String(learning.lesson_type ?? '').toUpperCase();
  const direction = String(learning.target_direction ?? '');
  const delta = typeof learning.delta === 'number' && Number.isFinite(learning.delta) ? learning.delta : null;
  if (status === 'achieved' || status === 'target_achieved' || lesson === 'TARGET_ACHIEVED') {
    return {
      applied: true,
      source_mission_id: String(latest.mission_id),
      reason: 'Prior target was achieved; preserve the successful direction while avoiding unnecessary escalation.',
      adjustments: { priority_delta: -5, target_value: null, baseline_value: null, action_bias: 'retain' },
      confidence: Math.min(0.95, Number(latest.confidence)),
    };
  }
  if (status === 'not_achieved' || status === 'target_missed' || lesson === 'TARGET_MISSED') {
    const priorityDelta = direction === 'higher_is_better' || direction === 'maximize' ? 5 : 8;
    return {
      applied: true,
      source_mission_id: String(latest.mission_id),
      reason: 'Prior target was missed; increase decision attention and require a materially adapted action plan.',
      adjustments: { priority_delta: priorityDelta, target_value: null, baseline_value: null, action_bias: delta != null && delta < 0 ? 'change' : 'reduce_risk' },
      confidence: Math.min(0.9, Number(latest.confidence)),
    };
  }
  if (lesson === 'POSITIVE_DELTA' || (delta != null && delta > 0)) {
    return {
      applied: true,
      source_mission_id: String(latest.mission_id),
      reason: 'Prior measured outcome shows positive movement; retain the effective direction.',
      adjustments: { priority_delta: 0, target_value: null, baseline_value: null, action_bias: 'retain' },
      confidence: Math.min(0.8, Number(latest.confidence)),
    };
  }
  return {
    applied: false,
    source_mission_id: String(latest.mission_id),
    reason: 'Prior learning is insufficient for a safe adaptive change.',
    adjustments: { priority_delta: 0, target_value: null, baseline_value: null, action_bias: 'retain' },
    confidence: Math.min(0.6, Number(latest.confidence)),
  };
}

function parseJson<T = Record<string, unknown>>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned) as T; } catch { const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}'); if (start < 0 || end <= start) throw new Error('AI returned invalid structured data'); return JSON.parse(cleaned.slice(start, end + 1)) as T; }
}
function normalizePlan(input: Partial<Plan>): Plan {
  const mission = input.mission ?? {};
  const rawPrediction = input.prediction ?? {};
  const actions = Array.isArray(input.actions) ? input.actions : [];
  const prediction: Prediction = {
    horizon: String(rawPrediction.horizon || 'not specified').slice(0, 80),
    predicted_outcome: String(rawPrediction.predicted_outcome || mission.goal || 'Outcome not specified.').slice(0, 500),
    baseline: numberOrNull(rawPrediction.baseline),
    target: numberOrNull(rawPrediction.target),
    expected_value: numberOrNull(rawPrediction.expected_value),
    unit: rawPrediction.unit == null ? null : String(rawPrediction.unit).slice(0, 40),
    probability_of_success: clampFloat(rawPrediction.probability_of_success, 0, 1, 0.5),
    confidence: clampFloat(rawPrediction.confidence, 0, 1, 0.35),
    risk_level: rawPrediction.risk_level === 'high' || rawPrediction.risk_level === 'medium' ? rawPrediction.risk_level : 'low',
    key_assumptions: Array.isArray(rawPrediction.key_assumptions) ? rawPrediction.key_assumptions.slice(0,5).map(String) : [],
    leading_indicators: Array.isArray(rawPrediction.leading_indicators) ? rawPrediction.leading_indicators.slice(0,5).map(String) : [],
    failure_conditions: Array.isArray(rawPrediction.failure_conditions) ? rawPrediction.failure_conditions.slice(0,5).map(String) : [],
  };
  return {
    diagnosis: String(input.diagnosis || 'No diagnosis returned.').slice(0, 700),
    root_causes: Array.isArray(input.root_causes) ? input.root_causes.slice(0, 5).map(String) : [],
    mission: { title: String(mission.title || 'Growth Mission').slice(0, 160), goal: String(mission.goal || 'Improve business growth').slice(0, 500), priority: clamp(mission.priority, 0, 100, 50), target_value: numberOrNull(mission.target_value), baseline_value: numberOrNull(mission.baseline_value), unit: mission.unit == null ? null : String(mission.unit).slice(0, 40) },
    prediction,
    actions: actions.slice(0, 5).map((action) => ({ title: String(action?.title || 'Action').slice(0, 180), description: String(action?.description || '').slice(0, 1000), action_type: String(action?.action_type || 'recommendation').slice(0, 60), impact_score: clamp(action?.impact_score, 0, 100, 50), effort_score: clamp(action?.effort_score, 0, 100, 50), risk_level: action?.risk_level === 'high' || action?.risk_level === 'medium' ? action.risk_level : 'low' })),
  };
}
function clampFloat(value: unknown, min: number, max: number, fallback: number): number { const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback; return Math.max(min, Math.min(max, n)); }
function qualitySafeNumber(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function calibratePrediction(prediction: Prediction, mission: Plan['mission'], _tokenCount: number): Prediction {
  const hasNumericEvidence = prediction.baseline !== null || prediction.target !== null || prediction.expected_value !== null;
  const evidenceFactor = hasNumericEvidence ? 1 : 0.75;
  const boundedConfidence = Math.min(prediction.confidence, hasNumericEvidence ? 0.9 : 0.55);
  const probability = Math.max(0.05, Math.min(0.95, prediction.probability_of_success * evidenceFactor));
  return {
    ...prediction,
    baseline: prediction.baseline ?? mission.baseline_value,
    target: prediction.target ?? mission.target_value,
    unit: prediction.unit ?? mission.unit,
    probability_of_success: Number(probability.toFixed(3)),
    confidence: Number(boundedConfidence.toFixed(3)),
  };
}
function numberOrNull(value: unknown): number | null { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
function clamp(value: unknown, min: number, max: number, fallback: number): number { const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback; return Math.max(min, Math.min(max, n)); }
function priorityFromNumber(value: number): Priority { if (value >= 90) return 'critical'; if (value >= 70) return 'high'; if (value >= 40) return 'medium'; return 'low'; }
function json(body: unknown, status: number, corsHeaders: Record<string, string>) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
