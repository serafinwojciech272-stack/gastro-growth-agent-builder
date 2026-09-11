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
  const totalSignals = input.measuredOutcomes + input.learningSignals;
  const hasExecution = input.activeMissions + input.openActions + input.pendingApprovals > 0;
  const hasMeasurement = input.measuredOutcomes > 0;

  if (!hasMeasurement && !hasExecution && input.learningSignals === 0) {
    return { score: null, confidence: 0, status: "unknown", evidence: ["No execution or outcome evidence is available yet."] };
  }

  const executionScore = Math.min(30, (input.activeMissions * 15) + (input.openActions * 5));
  const governanceScore = input.pendingApprovals === 0 ? 20 : Math.max(5, 20 - input.pendingApprovals * 5);
  const measurementScore = Math.min(30, input.measuredOutcomes * 10);
  const outcomeRate = input.measuredOutcomes ? input.positiveOutcomes / input.measuredOutcomes : 0;
  const outcomeScore = Math.round(outcomeRate * 20);
  const score = Math.max(0, Math.min(100, executionScore + governanceScore + measurementScore + outcomeScore));
  const confidence = Math.min(100, Math.round((totalSignals / 8) * 100));

  if (input.activeMissions > 0) evidence.push(`${input.activeMissions} active mission${input.activeMissions === 1 ? "" : "s"} in execution.`);
  if (input.pendingApprovals > 0) evidence.push(`${input.pendingApprovals} mission${input.pendingApprovals === 1 ? "" : "s"} awaiting approval.`);
  if (input.measuredOutcomes > 0) evidence.push(`${input.measuredOutcomes} measured outcome${input.measuredOutcomes === 1 ? "" : "s"}.`);
  if (input.positiveOutcomes > 0) evidence.push(`${input.positiveOutcomes} positive measured outcome${input.positiveOutcomes === 1 ? "" : "s"}.`);
  if (input.learningSignals > 0) evidence.push(`${input.learningSignals} learning signal${input.learningSignals === 1 ? "" : "s"} captured.`);

  return {
    score,
    confidence,
    status: score >= 80 ? "strong" : score >= 60 ? "healthy" : "needs_attention",
    evidence,
  };
}
