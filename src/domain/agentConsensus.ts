export type AgentOpinion = { agentId: string; role: string; score: number; confidence: number; recommendation: string; concerns: string[] };

export type ConsensusResult = { recommendation: string; score: number; confidence: number; dissent: string[]; requiresHumanReview: boolean };

export function reachConsensus(opinions: readonly AgentOpinion[]): ConsensusResult {
  if (!opinions.length) throw new Error("Consensus requires at least one agent opinion");
  const weighted = new Map<string, number>();
  for (const opinion of opinions) weighted.set(opinion.recommendation, (weighted.get(opinion.recommendation) ?? 0) + Math.max(0, opinion.score) * Math.max(0, Math.min(1, opinion.confidence)));
  const recommendation = [...weighted.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const total = [...weighted.values()].reduce((a, b) => a + b, 0) || 1;
  const confidence = Math.min(1, (weighted.get(recommendation) ?? 0) / total);
  const dissent = opinions.filter((opinion) => opinion.recommendation !== recommendation).map((opinion) => opinion.agentId);
  return { recommendation, score: weighted.get(recommendation) ?? 0, confidence, dissent, requiresHumanReview: confidence < 0.65 || dissent.length >= Math.ceil(opinions.length / 2) };
}
