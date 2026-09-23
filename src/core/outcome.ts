import { deriveLearning, type GrowthOutcome } from "../domain/growthTypes";
import { recordMissionOutcome, type OutcomeInput } from "../domain/outcomeEngine";
import type { CoreLearning, CoreOutcome } from "./contracts";

export type CoreOutcomeInput = OutcomeInput;

export function toCoreOutcome(outcome: GrowthOutcome): CoreOutcome {
  return {
    missionId: outcome.missionId,
    status: outcome.status,
    measuredAt: outcome.measuredAt,
    metrics: outcome.metrics,
    evidenceIds: outcome.evidence ?? [],
    confidence: outcome.confidence,
  };
}

export function toCoreLearning(outcome: GrowthOutcome): CoreLearning {
  const learning = deriveLearning(outcome);
  return {
    sourceOutcomeId: learning.sourceOutcomeId ?? outcome.missionId,
    insight: learning.insight,
    confidence: learning.confidence,
    reusable: learning.reusable,
    nextRecommendation: learning.nextRecommendation,
  };
}

/**
 * Uses the existing outcome classifier. The Core boundary owns the contract,
 * while the current Growth Advisor implementation remains the single source
 * of truth until outcome persistence is extracted behind an adapter.
 */
export function recordCoreOutcome(input: CoreOutcomeInput): CoreOutcome {
  return toCoreOutcome(recordMissionOutcome(input));
}
