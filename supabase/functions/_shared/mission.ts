import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callOpenRouter, parseJson } from './ai.ts';
import { evaluateStructuredOutput } from './quality.ts';
import { selectModel } from './router.ts';

export type MissionPlan = {
  title: string;
  goal: string;
  priority: number;
  target_value: number | null;
  baseline_value: number | null;
  unit: string | null;
  actions: Array<{
    title: string;
    description: string;
    action_type: string;
    impact_score: number;
    effort_score: number;
    risk_level: 'low' | 'medium' | 'high';
  }>;
};

export async function buildMissionPlan(params: {
  restaurant: Record<string, unknown>;
  diagnosis: string;
  rootCauses: string[];
  recommendations: unknown[];
}): Promise<{ plan: MissionPlan; model: string; qualityScore: number }> {
  const modelChoice = await selectModel('recommendations', []);
  const result = await callOpenRouter({
    task: 'recommendations',
    selectedModel: modelChoice.model,
    system: `You are GGA Mission Planner. Convert a restaurant diagnosis into one measurable growth mission and 2-5 executable actions. Never invent baseline or target numbers. Use null when data is missing. Prioritize high-impact, low-effort actions. Return JSON only: title, goal, priority (0-100), target_value, baseline_value, unit, actions[]. Each action needs title, description, action_type, impact_score (0-100), effort_score (0-100), risk_level (low|medium|high).`,
    user: JSON.stringify(params),
    temperature: 0.15,
  });

  const plan = normalizeMissionPlan(parseJson<Partial<MissionPlan>>(result.content));
  const quality = evaluateStructuredOutput(plan, {
    required: ['title', 'goal', 'priority', 'actions'],
    arrays: ['actions'],
    minItems: { actions: 2 },
    maxItems: { actions: 5 },
    maxStringLength: { title: 160, goal: 500 },
  });
  if (quality.score < 75) throw new Error('Mission plan failed quality gate');
  return { plan, model: result.model, qualityScore: quality.score };
}

export async function persistMissionPlan(params: {
  userId: string;
  restaurantId: string;
  plan: MissionPlan;
  sourceAnalysisId?: string;
}): Promise<{ missionId: string; actionIds: string[] }> {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Supabase environment is incomplete');
  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_AUTH_TOKEN') || ''}` } } });
  const { data: mission, error } = await supabase.from('growth_missions').insert({
    restaurant_id: params.restaurantId,
    title: params.plan.title,
    goal: params.plan.goal,
    target_value: params.plan.target_value,
    baseline_value: params.plan.baseline_value,
    unit: params.plan.unit,
    priority: params.plan.priority,
    status: 'draft',
    created_by: params.userId,
    metadata: { source_analysis_id: params.sourceAnalysisId ?? null },
  }).select('id').single();
  if (error) throw error;

  const actions = params.plan.actions.map((action) => ({
    mission_id: mission.id,
    restaurant_id: params.restaurantId,
    ...action,
    status: 'proposed',
    created_by: params.userId,
  }));
  const { data: inserted, error: actionError } = await supabase.from('growth_actions').insert(actions).select('id');
  if (actionError) throw actionError;
  return { missionId: mission.id, actionIds: (inserted ?? []).map((row) => row.id) };
}

function normalizeMissionPlan(input: Partial<MissionPlan>): MissionPlan {
  const actions = Array.isArray(input.actions) ? input.actions : [];
  return {
    title: String(input.title || 'Growth Mission').slice(0, 160),
    goal: String(input.goal || 'Improve restaurant growth').slice(0, 500),
    priority: clampInt(input.priority, 0, 100, 50),
    target_value: numberOrNull(input.target_value),
    baseline_value: numberOrNull(input.baseline_value),
    unit: input.unit == null ? null : String(input.unit).slice(0, 40),
    actions: actions.slice(0, 5).map((action) => ({
      title: String(action?.title || 'Action').slice(0, 180),
      description: String(action?.description || '').slice(0, 1000),
      action_type: String(action?.action_type || 'recommendation').slice(0, 60),
      impact_score: clampInt(action?.impact_score, 0, 100, 50),
      effort_score: clampInt(action?.effort_score, 0, 100, 50),
      risk_level: action?.risk_level === 'high' || action?.risk_level === 'medium' ? action.risk_level : 'low',
    })),
  };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.max(min, Math.min(max, n));
}
