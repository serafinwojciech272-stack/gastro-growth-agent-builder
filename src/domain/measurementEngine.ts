import type { GrowthKpi, GrowthOutcome } from "./growthTypes";
import { classifyOutcome } from "./growthTypes";

export function measureKpi(kpi: GrowthKpi, before: number | undefined, after: number | undefined, evidence: string[] = []): GrowthOutcome["metrics"][string] {
  const delta = before !== undefined && after !== undefined ? after - before : undefined;
  return { baseline: kpi.baseline, before, after, delta };
}

export function buildOutcome(input: { missionId: string; actionId?: string; kpi: GrowthKpi; before?: number; after?: number; confidence: number; evidence?: string[] }): GrowthOutcome {
  const metric = measureKpi(input.kpi, input.before, input.after, input.evidence);
  return {
    missionId: input.missionId,
    actionId: input.actionId,
    status: classifyOutcome(input.confidence, metric.delta),
    measuredAt: new Date().toISOString(),
    metrics: { [input.kpi.key]: metric },
    evidence: input.evidence ?? [],
    confidence: Math.max(0, Math.min(1, input.confidence)),
  };
}
