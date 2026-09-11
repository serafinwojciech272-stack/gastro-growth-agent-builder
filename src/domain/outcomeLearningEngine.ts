import type { GrowthOutcome, GrowthLearning } from "./growthTypes";
import { deriveLearning, normalizeOutcomeConfidence } from "./growthTypes";

export type OutcomeMeasurementInput = {
  missionId: string;
  actionId?: string;
  measuredAt: string;
  metrics: GrowthOutcome["metrics"];
  evidence?: string[];
  confidence: number;
};

export type OutcomeMeasurementResult = {
  outcome: GrowthOutcome;
  learning: GrowthLearning;
};

export function measureGrowthOutcome(input: OutcomeMeasurementInput): OutcomeMeasurementResult {
  const confidence = normalizeOutcomeConfidence(input.confidence);
  const metrics = Object.fromEntries(Object.entries(input.metrics).map(([key, metric]) => {
    const delta = metric.delta ?? (metric.before !== undefined && metric.after !== undefined ? metric.after - metric.before : undefined);
    return [key, { ...metric, delta }];
  }));
  const deltas = Object.values(metrics).map((metric) => metric.delta).filter((delta): delta is number => delta !== undefined);
  const aggregate = deltas.length === 0 ? undefined : deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
  const outcome: GrowthOutcome = {
    missionId: input.missionId,
    actionId: input.actionId,
    measuredAt: input.measuredAt,
    metrics,
    evidence: input.evidence,
    confidence,
    status: aggregate === undefined ? "insufficient_data" : aggregate > 0 ? (confidence >= 0.8 ? "success" : "partial_success") : aggregate === 0 ? "no_impact" : "negative",
  };
  const learning = deriveLearning(outcome);
  return { outcome: { ...outcome, learning }, learning };
}

export function applyOutcomeToKpiBaseline(
  baseline: Record<string, number>,
  outcome: GrowthOutcome,
): Record<string, number> {
  const next = { ...baseline };
  for (const [key, metric] of Object.entries(outcome.metrics)) {
    if (metric.after !== undefined) next[key] = metric.after;
  }
  return next;
}
