export type ModelTask =
  | "diagnosis"
  | "recommendation"
  | "mission_planning"
  | "content_generation"
  | "classification"
  | "evaluation";

export type ModelCapability = "reasoning" | "structured_output" | "vision" | "fast" | "low_cost";
export type ModelCostTier = "low" | "medium" | "high";
export type ModelQualityTier = "standard" | "strong" | "frontier";

export type ModelCandidate = {
  id: string;
  provider: string;
  capabilities: ModelCapability[];
  costTier: ModelCostTier;
  qualityTier: ModelQualityTier;
  enabled: boolean;
};

export type ModelPolicy = {
  preferred: string[];
  fallback: string[];
  maxCostTier: ModelCostTier;
  requireStructuredOutput: boolean;
  evaluationRequired: boolean;
};

export type ModelSelection = {
  task: ModelTask;
  selected: ModelCandidate;
  fallbackChain: ModelCandidate[];
  reasons: string[];
};

const COST_RANK: Record<ModelCostTier, number> = { low: 1, medium: 2, high: 3 };
const QUALITY_RANK: Record<ModelQualityTier, number> = { standard: 1, strong: 2, frontier: 3 };

const REQUIRED_CAPABILITIES: Partial<Record<ModelTask, ModelCapability[]>> = {
  diagnosis: ["reasoning"],
  mission_planning: ["reasoning"],
  evaluation: ["reasoning"],
};

function supports(candidate: ModelCandidate, task: ModelTask, policy: ModelPolicy): boolean {
  if (!candidate.enabled) return false;
  if (COST_RANK[candidate.costTier] > COST_RANK[policy.maxCostTier]) return false;
  if (policy.requireStructuredOutput && !candidate.capabilities.includes("structured_output")) return false;
  return (REQUIRED_CAPABILITIES[task] ?? []).every((capability) => candidate.capabilities.includes(capability));
}

function scoreCandidate(candidate: ModelCandidate, task: ModelTask, policy: ModelPolicy): number {
  const preferred = policy.preferred.indexOf(candidate.id);
  const fallback = policy.fallback.indexOf(candidate.id);
  const quality = QUALITY_RANK[candidate.qualityTier] * 100;
  const costEfficiency = (4 - COST_RANK[candidate.costTier]) * 10;
  const speed = candidate.capabilities.includes("fast") ? 5 : 0;
  const taskFit = task === "content_generation" && candidate.capabilities.includes("vision") ? 2 : 0;
  const preferredBonus = preferred >= 0 ? 1000 - preferred * 25 : 0;
  const fallbackBonus = fallback >= 0 ? 50 - fallback * 5 : 0;
  return quality + costEfficiency + speed + taskFit + preferredBonus + fallbackBonus;
}

export function selectModel(task: ModelTask, candidates: ModelCandidate[], policy: ModelPolicy): ModelSelection {
  const eligible = candidates.filter((candidate) => supports(candidate, task, policy));
  if (!eligible.length) throw new Error(`No enabled model satisfies policy for task: ${task}`);

  const ranked = [...eligible].sort((a, b) => scoreCandidate(b, task, policy) - scoreCandidate(a, task, policy) || a.id.localeCompare(b.id));
  const selected = ranked[0];

  return {
    task,
    selected,
    fallbackChain: ranked.slice(1),
    reasons: [
      `task=${task}`,
      `quality=${selected.qualityTier}`,
      `cost=${selected.costTier}`,
      `structured_output=${policy.requireStructuredOutput ? "required" : "optional"}`,
      `evaluation=${policy.evaluationRequired ? "required" : "optional"}`,
    ],
  };
}

export function canFallback(selection: ModelSelection, failedModelId: string): boolean {
  return selection.selected.id === failedModelId && selection.fallbackChain.length > 0;
}
