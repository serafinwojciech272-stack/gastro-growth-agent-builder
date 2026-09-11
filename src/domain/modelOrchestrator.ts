export type ModelTask =
  | "diagnosis"
  | "recommendation"
  | "mission_planning"
  | "content_generation"
  | "classification"
  | "evaluation";

export type ModelCapability = "reasoning" | "structured_output" | "vision" | "fast" | "low_cost";

export type ModelCandidate = {
  id: string;
  provider: string;
  capabilities: ModelCapability[];
  costTier: "low" | "medium" | "high";
  qualityTier: "standard" | "strong" | "frontier";
  enabled: boolean;
};

export type ModelPolicy = {
  preferred: string[];
  fallback: string[];
  maxCostTier: ModelCandidate["costTier"];
  requireStructuredOutput: boolean;
  evaluationRequired: boolean;
};

export type ModelSelection = {
  task: ModelTask;
  selected: ModelCandidate;
  fallbackChain: ModelCandidate[];
  reasons: string[];
};

const COST_RANK: Record<ModelCandidate["costTier"], number> = { low: 1, medium: 2, high: 3 };
const QUALITY_RANK: Record<ModelCandidate["qualityTier"], number> = { standard: 1, strong: 2, frontier: 3 };

export function selectModel(task: ModelTask, candidates: ModelCandidate[], policy: ModelPolicy): ModelSelection {
  const available = candidates.filter((candidate) => candidate.enabled && COST_RANK[candidate.costTier] <= COST_RANK[policy.maxCostTier]);
  if (!available.length) throw new Error(`No enabled model satisfies policy for task: ${task}`);

  const preferred = policy.preferred.map((id) => available.find((candidate) => candidate.id === id)).filter(Boolean) as ModelCandidate[];
  const capable = available.filter((candidate) => {
    if (policy.requireStructuredOutput && !candidate.capabilities.includes("structured_output")) return false;
    if (["diagnosis", "mission_planning", "evaluation"].includes(task) && !candidate.capabilities.includes("reasoning")) return false;
    return true;
  });
  const pool = capable.length ? capable : available;
  const ranked = [...pool].sort((a, b) => {
    const aPreferred = preferred.some((candidate) => candidate.id === a.id) ? 1 : 0;
    const bPreferred = preferred.some((candidate) => candidate.id === b.id) ? 1 : 0;
    if (aPreferred !== bPreferred) return bPreferred - aPreferred;
    return QUALITY_RANK[b.qualityTier] - QUALITY_RANK[a.qualityTier] || COST_RANK[a.costTier] - COST_RANK[b.costTier];
  });
  const selected = ranked[0];
  return {
    task,
    selected,
    fallbackChain: ranked.slice(1),
    reasons: [
      `task=${task}`,
      `quality=${selected.qualityTier}`,
      `cost=${selected.costTier}`,
      policy.evaluationRequired ? "evaluation=required" : "evaluation=optional",
    ],
  };
}
