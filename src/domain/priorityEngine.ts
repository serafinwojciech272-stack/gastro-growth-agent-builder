import type { Opportunity, PriorityPolicy, PriorityScore } from "./universalBusinessCore";
import { rankOpportunities } from "./universalBusinessCore";

export type PriorityCandidate = Opportunity;

export function rankPriorityCandidates(
  candidates: readonly PriorityCandidate[],
  policy?: PriorityPolicy,
): PriorityScore[] {
  return rankOpportunities(candidates, policy);
}
