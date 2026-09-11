import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, modelsFor, parseJson } from '../_shared/ai.ts';
import { selectModel } from '../_shared/router.ts';
import { evaluateStructuredOutput } from '../_shared/quality.ts';
import { getCorsHeaders } from '../_shared/cors.ts';

type Priority = 'low' | 'medium' | 'high' | 'critical';
type Recommendation = { title: string; rationale: string; priority: Priority; actions: string[] };
type AdvisorResult = { diagnosis: string; root_causes: string[]; recommendations: Recommendation[]; priority: Priority };

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsHeaders);
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Authentication required' }, 401, corsHeaders);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: 'Supabase environment is incomplete' }, 500, corsHeaders);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: 'Invalid session' }, 401, corsHeaders);
    const body = await req.json();
    const problem = typeof body?.problem === 'string' ? body.problem.trim() : '';
    if (problem.length < 8) return json({ error: 'Describe the business problem in at least 8 characters.' }, 400, corsHeaders);
    if (problem.length > 4000) return json({ error: 'Problem description is too long.' }, 400, corsHeaders);
    const { data: memberships, error: membershipError } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).limit(1);
    if (membershipError) throw membershipError;
    const organizationId = memberships?.[0]?.organization_id;
    if (!organizationId) return json({ error: 'No business workspace found.' }, 404, corsHeaders);
    const { data: restaurant, error: restaurantError } = await supabase.from('restaurants').select('id,organization_id,name,cuisine,city,country,website,price_segment,seats,average_ticket,target_customer,business_goals,current_problems,opening_hours,business_profile_id').eq('organization_id', organizationId).limit(1).maybeSingle();
    if (restaurantError) throw restaurantError;
    if (!restaurant) return json({ error: 'Complete business onboarding first.' }, 404, corsHeaders);

    const system = `You are GA, a practical business growth strategist. Analyze the user's problem using only the supplied business context. Never invent facts. Separate known context from assumptions. Prioritize actions by business impact, confidence, effort and risk. Return JSON only with diagnosis, root_causes, recommendations and priority. diagnosis max 700 characters; root_causes 2-5 items; recommendations 2-4 items; each recommendation has title, rationale, priority (low|medium|high|critical) and 2-4 concrete actions. If information is missing, state the limitation or recommend collecting it.`;
    const selected = await selectModel('advisor', modelsFor('advisor'));
    const ai = await callOpenRouter({ task: 'advisor', system, user: JSON.stringify({ business: restaurant, user_problem: problem }), temperature: 0.2, selectedModel: selected.model });
    const parsed = normalizeAdvisorResult(parseJson<Partial<AdvisorResult>>(ai.content));
    const quality = evaluateStructuredOutput(parsed, { required: ['diagnosis', 'root_causes', 'recommendations', 'priority'], arrays: ['root_causes', 'recommendations'], minItems: { root_causes: 2, recommendations: 2 }, maxItems: { root_causes: 5, recommendations: 4 }, maxStringLength: { diagnosis: 700 } });
    if (quality.score < 70) return json({ error: 'AI output failed the quality gate.', quality_score: quality.score, model: ai.model }, 502, corsHeaders);

    const { data: saved, error: saveError } = await supabase.from('ai_analyses').insert({ restaurant_id: restaurant.id, user_id: user.id, problem, diagnosis: parsed.diagnosis, root_causes: parsed.root_causes, recommendations: parsed.recommendations, priority: parsed.priority }).select('id,created_at').single();
    if (saveError) throw saveError;

    const analysis = buildGrowthAnalysis(saved.id, saved.created_at, restaurant, problem, parsed, quality.score);
    const { error: telemetryError } = await supabase.rpc('record_ai_run', { p_restaurant_id: restaurant.id, p_task: 'advisor', p_model: ai.model, p_attempts: ai.attempts, p_latency_ms: ai.latencyMs, p_prompt_tokens: ai.usage?.promptTokens ?? null, p_completion_tokens: ai.usage?.completionTokens ?? null, p_total_tokens: ai.usage?.totalTokens ?? null, p_success: true, p_quality_score: quality.score, p_metadata: { checks: quality.checks, analysis_id: saved.id, contract_version: analysis.version } });
    if (telemetryError) console.error('GA telemetry error:', telemetryError);
    return json({ ...analysis, model: ai.model, latency_ms: ai.latencyMs, attempts: ai.attempts, quality_score: quality.score }, 200, corsHeaders);
  } catch (error) {
    console.error('GA advisor error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected advisor error.' }, 502, corsHeaders);
  }
});

function buildGrowthAnalysis(id: string, createdAt: string, restaurant: Record<string, unknown>, problem: string, result: AdvisorResult, qualityScore: number) {
  const businessId = String(restaurant.business_profile_id || restaurant.id);
  const evidenceId = `${id}:evidence:problem`;
  const diagnosisId = `${id}:diagnosis`;
  const evidence = [{ id: evidenceId, businessId, type: 'human_input', source: 'user', observation: problem, epistemic_status: 'fact', confidence: 100, observedAt: createdAt }];
  const hypotheses = result.root_causes.map((cause, index) => ({ id: `${id}:hypothesis:${index + 1}`, businessId, statement: cause, rationale: 'AI-generated hypothesis derived from the supplied problem and available business context.', evidenceIds: [evidenceId], unknowns: ['Baseline performance and causal contribution require measurement.'], alternatives: [], confidence: Math.max(0, qualityScore - 10), status: 'open' }));
  const opportunities = result.recommendations.map((recommendation, index) => ({ id: `${id}:opportunity:${index + 1}`, businessId, title: recommendation.title, description: recommendation.rationale, sourceDiagnosisId: diagnosisId, sourceHypothesisIds: hypotheses.slice(0, 2).map((hypothesis) => hypothesis.id), impact: priorityScore(recommendation.priority), urgency: priorityScore(recommendation.priority), confidence: qualityScore, effort: 50, cost: 40, risk: recommendation.priority === 'critical' ? 60 : 30, strategicValue: priorityScore(recommendation.priority), dependencies: [], expectedOutcome: recommendation.actions[0] || recommendation.rationale, relatedKpis: [] }));
  const recommendations = result.recommendations.map((recommendation, index) => ({ id: `${id}:recommendation:${index + 1}`, businessId, opportunityId: opportunities[index].id, title: recommendation.title, rationale: recommendation.rationale, actions: recommendation.actions, expectedOutcome: recommendation.actions[0] || recommendation.rationale, confidence: qualityScore, evidenceIds: [evidenceId], policyVersion: 'priority-v1' }));
  const selected = opportunities[0];
  const decision = selected ? [{ id: `${id}:decision:1`, businessId, selectedOpportunityId: selected.id, rationale: 'Selected as the first governed growth opportunity returned by the evidence-constrained analysis.', rejectedOpportunityIds: opportunities.slice(1).map((opportunity) => opportunity.id), expectedImpact: selected.expectedOutcome, confidence: qualityScore, evidenceIds: [evidenceId], requiresApproval: true, createdAt }] : [];
  const missionProposals = selected && decision[0] ? [{ id: `${id}:mission:1`, businessId, decisionId: decision[0].id, objective: selected.expectedOutcome || selected.title, actions: recommendations[0]?.actions || [], kpis: [], expectedOutcome: selected.expectedOutcome || selected.title, risk: selected.risk >= 60 ? 'high' : selected.risk >= 35 ? 'medium' : 'low', requiresApproval: true, proposedAt: createdAt }] : [];
  const unknowns = ['Revenue baseline', 'Conversion or retention baseline', 'Causal contribution of each proposed intervention'];
  return { version: '1.2.0', analysisId: id, createdAt, businessContext: { business: { id: businessId, organizationId: String(restaurant.organization_id || ''), name: String(restaurant.name || 'Business'), industry: String(restaurant.cuisine || 'unknown'), businessModel: 'unknown', websiteUrl: typeof restaurant.website === 'string' ? restaurant.website : undefined, locations: [String(restaurant.city || '')].filter(Boolean), products: [], services: [], customerSegments: typeof restaurant.target_customer === 'string' ? [restaurant.target_customer] : [], competitors: [], goals: typeof restaurant.business_goals === 'string' ? [restaurant.business_goals] : [], constraints: [], createdAt, updatedAt: createdAt }, entities: [], relationships: [], activeGoals: [], activeConstraints: [], verticalContext: { cuisine: restaurant.cuisine, price_segment: restaurant.price_segment, seats: restaurant.seats, average_ticket: restaurant.average_ticket }, lastUpdatedAt: createdAt }, problem, evidence, unknowns, hypotheses, opportunities, diagnosis: { id: diagnosisId, businessId, title: 'Growth diagnosis', problem, symptoms: [problem], rootCauses: result.root_causes, impact: result.diagnosis, confidence: qualityScore, signalIds: [], evidenceIds: [evidenceId], alternatives: [], createdAt }, decisions: decision, recommendations, missionProposals, expectedOutcomes: selected ? [selected.expectedOutcome || selected.title] : [], kpis: [], confidence: qualityScore, risks: ['Recommendations are hypotheses until baseline and outcome measurement are available.'], learningTargets: ['Measure baseline before execution', 'Compare predicted impact with actual outcome'], priority: result.priority };
}
function priorityScore(priority: Priority): number { return priority === 'critical' ? 95 : priority === 'high' ? 80 : priority === 'medium' ? 60 : 35; }
function normalizeAdvisorResult(input: Partial<AdvisorResult>): AdvisorResult { return { diagnosis: String(input.diagnosis || 'No diagnosis was returned.').slice(0, 700), root_causes: Array.isArray(input.root_causes) ? input.root_causes.slice(0, 5).map(String) : [], recommendations: Array.isArray(input.recommendations) ? input.recommendations.slice(0, 4).map((r) => ({ title: String(r?.title || 'Recommendation').slice(0, 180), rationale: String(r?.rationale || '').slice(0, 1000), priority: normalizePriority(r?.priority), actions: Array.isArray(r?.actions) ? r.actions.slice(0, 4).map(String) : [] })) : [], priority: normalizePriority(input.priority) }; }
function normalizePriority(value: unknown): Priority { return value === 'low' || value === 'medium' || value === 'high' || value === 'critical' ? value : 'medium'; }
function json(body: unknown, status = 200, corsHeaders: Record<string, string> = {}) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }
