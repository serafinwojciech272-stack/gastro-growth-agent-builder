export type GrowthHealthInput = {
  activeMissions: number;
  pendingApprovals: number;
  openActions: number;
  measuredOutcomes: number;
  positiveOutcomes: number;
  learningSignals: number;
};

export type GrowthHealth = {
  score: number | null;
  confidence: number;
  status: "unknown" | "needs_attention" | "healthy" | "strong";
  evidence: string[];
};

export function calculateGrowthHealth(input: GrowthHealthInput): GrowthHealth {
  const evidence: string[] = [];
  const executionSignals = input.activeMissions + input.openActions;
  const hasEvidence = input.measuredOutcomes > 0 || input.learningSignals > 0;

  if (!hasEvidence) {
    if (input.pendingApprovals > 0) evidence.push(`${input.pendingApprovals} mission${input.pendingApprovals === 1 ? "" : "s"} awaiting approval; no measured outcome evidence yet.`);
    else if (executionSignals > 0) evidence.push("Execution activity exists, but no measured outcome evidence is available yet.");
    else evidence.push("No execution, outcome or learning evidence is available yet.");
    return { score: null, confidence: 0, status: "unknown", evidence };
  }

  const outcomeRate = input.measuredOutcomes > 0 ? input.positiveOutcomes / input.measuredOutcomes : 0;
  const measurementCoverage = Math.min(1, input.measuredOutcomes / 5);
  const learningCoverage = Math.min(1, input.learningSignals / 3);
  const executionCoverage = Math.min(1, executionSignals / 5);
  const governancePenalty = Math.min(20, input.pendingApprovals * 5);

  // Health describes demonstrated business performance, not activity volume.
  const outcomeScore = outcomeRate * 55;
  const measurementScore = measurementCoverage * 20;
  const learningScore = learningCoverage * 15;
  const executionScore = executionCoverage * 10;
  const score = Math.max(0, Math.min(100, Math.round(outcomeScore + measurementScore + learningScore + executionScore - governancePenalty)));
  const confidence = Math.min(100, Math.round((Math.min(5, input.measuredOutcomes) / 5) * 70 + learningCoverage * 30));

  if (input.measuredOutcomes > 0) evidence.push(`${input.measuredOutcomes} measured outcome${input.measuredOutcomes === 1 ? "" : "s"}; ${Math.round(outcomeRate * 100)}% positive.`);
  if (input.learningSignals > 0) evidence.push(`${input.learningSignals} learning signal${input.learningSignals === 1 ? "" : "s"} captured.`);
  if (input.activeMissions > 0) evidence.push(`${input.activeMissions} active mission${input.activeMissions === 1 ? "" : "s"} in execution.`);
  if (input.openActions > 0) evidence.push(`${input.openActions} open action${input.openActions === 1 ? "" : "s"}.`);
  if (input.pendingApprovals > 0) evidence.push(`${input.pendingApprovals} approval${input.pendingApprovals === 1 ? "" : "s"} pending; governance backlog reduces health.`);

  return {
    score,
    confidence,
    status: score >= 80 ? "strong" : score >= 60 ? "healthy" : "needs_attention",
    evidence,
  };
}
