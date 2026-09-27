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
  version: 'm9.6';
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
  evidence_count: number;
  historical_success_rate: number | null;
  prediction_method: 'evidence_bounded' | 'ai_plus_history' | 'insufficient_evidence';
};
type PolicyName = 'retain' | 'change' | 'reduce_risk' | 'explore';
type PolicyLearning = {
  version: 'm9.8';
  current_policy: PolicyName;
  recommended_policy: PolicyName;
  recommendation_confidence: number;
  evidence_count: number;
  basis: string[];
  stats: Record<PolicyName, { uses: number; successes: number; misses: number; success_rate: number | null; avg_confidence: number | null }>;
};
type DecisionPolicy = { version: 'm9.7'; policy: PolicyName; confidence: number; risk_budget: 'low' | 'medium' | 'high'; rationale: string; evidence_count: number; triggers: string[]; guardrails: string[]; learning: PolicyLearning; };
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
        policy: mission?.mission_json?.decision_policy?.policy ?? null,
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
    const policyLearning = derivePolicyLearning(learningContext);

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
    const prediction = derivePredictiveDecision(learningContext, plan.prediction, plan.mission, adaptiveAdjustment, qualitySafeNumber(ai.usage?.totalTokens));
    const decisionPolicy = deriveDecisionPolicy(learningContext, prediction, adaptiveAdjustment, policyLearning);
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
      decision_policy: decisionPolicy,
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
      decision_policy: decisionPolicy,
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

function derivePolicyLearning(context: Array<Record<string, unknown>>): PolicyLearning {
  const policies: PolicyName[] = ['retain', 'change', 'reduce_risk', 'explore'];
  const stats = Object.fromEntries(policies.map((p) => [p, { uses: 0, successes: 0, misses: 0, success_rate: null, avg_confidence: null }])) as PolicyLearning['stats'];
  const confidenceBuckets: Record<PolicyName, number[]> = { retain: [], change: [], reduce_risk: [], explore: [] };
  let evidenceCount = 0;
  for (const item of context) {
    const policy = item.policy && typeof item.policy === 'string' ? item.policy as PolicyName : null;
    if (!policy || !policies.includes(policy)) continue;
    const lj = item.learning_json && typeof item.learning_json === 'object' ? item.learning_json as Record<string, unknown> : {};
    const quality = String(lj.quality ?? '');
    if (quality !== 'VERIFIED') continue;
    const s = stats[policy];
    s.uses += 1;
    evidenceCount += 1;
    const status = String(lj.target_status ?? '').toLowerCase();
    const lesson = String(lj.lesson_type ?? '').toUpperCase();
    const success = status === 'achieved' || status === 'target_achieved' || lesson === 'TARGET_ACHIEVED' || lesson === 'POSITIVE_DELTA';
    if (success) s.successes += 1; else s.misses += 1;
    if (typeof item.confidence === 'number' && Number.isFinite(item.confidence)) confidenceBuckets[policy].push(Math.max(0, Math.min(1, item.confidence)));
  }
  for (const policy of policies) {
    const s = stats[policy];
    s.success_rate = s.uses ? Number((s.successes / s.uses).toFixed(3)) : null;
    s.avg_confidence = confidenceBuckets[policy].length ? Number((confidenceBuckets[policy].reduce((a,b)=>a+b,0)/confidenceBuckets[policy].length).toFixed(3)) : null;
  }
  const currentPolicy: PolicyName = 'explore';
  const candidates = policies.filter((p) => stats[p].uses >= 3 && stats[p].success_rate !== null).sort((a,b) => (stats[b].success_rate! - stats[a].success_rate!));
  const recommendedPolicy = candidates.length ? candidates[0] : currentPolicy;
  const confidence = candidates.length ? Math.min(0.9, 0.45 + Math.min(0.35, stats[recommendedPolicy].uses * 0.07) + Math.min(0.1, Math.abs((stats[recommendedPolicy].success_rate ?? 0.5) - 0.5) * 0.2)) : 0.25;
  return {
    version: 'm9.8',
    current_policy: currentPolicy,
    recommended_policy: recommendedPolicy,
    recommendation_confidence: Number(confidence.toFixed(3)),
    evidence_count: evidenceCount,
    basis: candidates.length
      ? ['Only VERIFIED measured outcomes are used.', 'Minimum 3 verified uses are required before a policy can become the empirical recommendation.', 'Policy recommendation is informational and cannot bypass approval.']
      : ['Insufficient verified policy-specific evidence; retain governed exploration until at least one policy has 3 verified measured uses.'],
    stats,
  };
}

function deriveDecisionPolicy(context: Array<Record<string, unknown>>, prediction: Prediction, adaptive: AdaptiveAdjustment), learning: PolicyLearning): DecisionPolicy {
  const evidence = prediction.evidence_count;
  const probability = prediction.probability_of_success;
  const risk = prediction.risk_level;
  const verified = context.filter((item) => { const lj = item.learning_json && typeof item.learning_json === 'object' ? item.learning_json as Record<string, unknown> : {}; return lj.quality === 'VERIFIED'; }).length;
  let policy: PolicyName = 'explore';
  let rationale = 'Evidence is insufficient for a strong directional policy; gather information with a bounded experiment.';
  let riskBudget: DecisionPolicy['risk_budget'] = 'low';
  if (adaptive.applied && adaptive.adjustments.action_bias === 'reduce_risk') { policy='reduce_risk'; rationale='Prior measured evidence indicates that the previous target was missed; reduce execution risk before increasing commitment.'; }
  else if (adaptive.applied && adaptive.adjustments.action_bias === 'change') { policy='change'; rationale='Prior measured evidence indicates the previous direction underperformed; materially change the action plan.'; riskBudget=risk==='high'?'low':'medium'; }
  else if (learning.recommended_policy !== 'explore' && learning.recommendation_confidence >= 0.6 && risk !== 'high') {
    policy = learning.recommended_policy;
    rationale = 'M9.8 policy learning identifies a historically better-performing policy from verified measured outcomes.';
    riskBudget = policy === 'retain' ? 'medium' : 'low';
  }
  else if (evidence >= 3 && probability >= 0.7 && risk !== 'high') { policy='retain'; rationale='Multiple evidence points support retaining the current direction with controlled execution.'; riskBudget=risk==='medium'?'medium':'high'; }
  else if (evidence >= 1 && probability < 0.45) { policy='change'; rationale='Available evidence indicates low predicted success; change direction rather than repeat the same approach.'; }
  const triggers=['evidence_count>=3: '+(evidence>=3),'predicted_success>=0.70: '+(probability>=0.7),'high_risk: '+(risk==='high'),'verified_outcomes: '+verified,'adaptive_applied: '+adaptive.applied,'policy_learning_recommendation: '+learning.recommended_policy];
  const guardrails=['Approval remains mandatory before execution.','No policy may invent KPI evidence or bypass measurement.','High-risk predictions cannot receive a high execution risk budget.','Explore is the default when evidence is insufficient.','Policy learning uses VERIFIED outcomes only and never self-rewards from predictions.'];
  const confidence=Math.min(0.9,Math.max(0.25,(evidence>=3?0.75:evidence>=1?0.55:0.35)+(probability>=0.7?0.1:0)-(risk==='high'?0.1:0)));
  return {version:'m9.7',policy,confidence:Number(confidence.toFixed(3)),risk_budget:riskBudget,rationale,evidence_count:evidence,triggers,guardrails,learning};
}
