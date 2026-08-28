import type { GrowthOutcome, GrowthDecisionContext } from "./growthTypes";

export type LearningSignal = {
  kpi: string;
  direction: "positive" | "neutral" | "negative";
  confidence: number;
  sampleSize: number;
  evidence: string[];
};

export type LearningRecommendation = {
  signal: LearningSignal;
  recommendation: "scale" | "iterate" | "stop" | "collect_more_data";
};

export function learnFromOutcomes(context: GrowthDecisionContext, outcomes: readonly GrowthOutcome[]): LearningRecommendation[] {
  const byKpi = new Map<string, { deltas: number[]; evidence: string[]; confidences: number[] }>();
  for (const outcome of outcomes) for (const [kpi, metric] of Object.entries(outcome.metrics)) {
    const delta = metric.delta ?? (metric.before !== undefined && metric.after !== undefined ? metric.after - metric.before : undefined);
    if (delta === undefined) continue;
    const bucket = byKpi.get(kpi) ?? { deltas: [], evidence: [], confidences: [] };
    bucket.deltas.push(delta); bucket.evidence.push(...(outcome.evidence ?? [])); bucket.confidences.push(outcome.confidence); byKpi.set(kpi, bucket);
  }
  return context.kpis.flatMap((kpi) => {
    const bucket = byKpi.get(kpi.key);
    if (!bucket?.deltas.length) return [{ signal: { kpi: kpi.key, direction: "neutral", confidence: 0, sampleSize: 0, evidence: [] }, recommendation: "collect_more_data" } satisfies LearningRecommendation];
    const average = bucket.deltas.reduce((sum, value) => sum + value, 0) / bucket.deltas.length;
    const positive = bucket.deltas.filter((value) => value > 0).length;
    const negative = bucket.deltas.filter((value) => value < 0).length;
    const direction = positive > negative ? "positive" : negative > positive ? "negative" : "neutral";
    const sampleConfidence = Math.min(1, bucket.deltas.length / 5);
    const evidenceConfidence = bucket.confidences.reduce((a, b) => a + b, 0) / bucket.confidences.length;
    const confidence = Math.min(sampleConfidence, evidenceConfidence);
    const recommendation = confidence < 0.6 ? "collect_more_data" : direction === "positive" && average > 0 ? "scale" : direction === "negative" ? "stop" : "iterate";
    return [{ signal: { kpi: kpi.key, direction, confidence, sampleSize: bucket.deltas.length, evidence: [...new Set(bucket.evidence)].slice(0, 10) }, recommendation } satisfies LearningRecommendation];
  });
}
