import { AiTask, modelsFor } from './ai.ts';

export type ModelCandidate = {
  model: string;
  score: number;
  runs: number;
  statisticallyUseful: boolean;
};

type ScorecardRow = {
  task: AiTask;
  model: string;
  runs: number;
  model_score: number | null;
  statistically_useful: boolean;
};

const MIN_USEFUL_RUNS = 5;
const EXPLORATION_RUNS = 3;

export async function selectModel(task: AiTask, candidates: string[]): Promise<ModelCandidate> {
  const configured = [...new Set([...candidates, ...modelsFor(task)])].map((model) => model.trim()).filter(Boolean);
  const fallback = configured[0];
  if (!fallback) throw new Error(`No AI model configured for task: ${task}`);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return { model: fallback, score: 0, runs: 0, statisticallyUseful: false };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/ai_model_scorecard_v2?task=eq.${encodeURIComponent(task)}&select=task,model,runs,model_score,statistically_useful`,
      { headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` } },
    );
    if (!response.ok) return { model: fallback, score: 0, runs: 0, statisticallyUseful: false };

    const rows = (await response.json()) as ScorecardRow[];
    const byModel = new Map(rows.map((row) => [row.model, row]));

    // Models absent from the scorecard are first-class exploration candidates.
    const candidatesWithStats = configured.map((model) => {
      const row = byModel.get(model);
      return row ?? { task, model, runs: 0, model_score: 0, statistically_useful: false };
    });

    // Explore the least-tested model until every configured candidate has enough data.
    const unexplored = candidatesWithStats
      .filter((row) => row.runs < EXPLORATION_RUNS)
      .sort((a, b) => a.runs - b.runs || Number(b.model_score ?? 0) - Number(a.model_score ?? 0));
    if (unexplored.length > 0) {
      const row = unexplored[0];
      return { model: row.model, score: Number(row.model_score ?? 0), runs: row.runs, statisticallyUseful: false };
    }

    const useful = candidatesWithStats.filter((row) => row.runs >= MIN_USEFUL_RUNS);
    const pool = useful.length > 0 ? useful : candidatesWithStats;
    const best = [...pool].sort((a, b) => Number(b.model_score ?? 0) - Number(a.model_score ?? 0) || b.runs - a.runs)[0];
    return {
      model: best.model,
      score: Number(best.model_score ?? 0),
      runs: best.runs,
      statisticallyUseful: best.runs >= MIN_USEFUL_RUNS,
    };
  } catch {
    // Routing must never become a single point of failure for an AI request.
    return { model: fallback, score: 0, runs: 0, statisticallyUseful: false };
  }
}
