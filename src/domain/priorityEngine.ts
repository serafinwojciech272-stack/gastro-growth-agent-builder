import type { Opportunity, PriorityDecision, Recommendation } from "./businessIntelligenceContracts";
import { calculatePriorityScore } from "./businessIntelligenceContracts";

export type PriorityCandidate = Pick<Opportunity, "id" | "impactScore" | "confidenceScore" | "effortScore" | "riskScore" | "urgencyScore"> & {
  recommendationId?: Recommendation["id"];
};

export function rankPriorityCandidates(candidates: readonly PriorityCandidate[]): PriorityDecision[] {
  return [...candidates]
    .map((candidate) => {
      const factors = {
        impact: candidate.impactScore,
        confidence: candidate.confidenceScore,
        effort: candidate.effortScore,
        risk: candidate.riskScore,
        urgency: candidate.urgencyScore,
      };
      return {
        recommendationId: candidate.recommendationId ?? candidate.id,
        score: calculatePriorityScore(factors),
        rank: 0,
        factors,
        rationale: `Impact ${candidate.impactScore}, confidence ${candidate.confidenceScore}, urgency ${candidate.urgencyScore}, effort ${candidate.effortScore}, risk ${candidate.riskScore}.`,
      } satisfies PriorityDecision;
    })
    .sort((a, b) => b.score - a.score)
    .map((decision, index) => ({ ...decision, rank: index + 1 }));
}
