import type { GrowthMission, GrowthOutcome } from "./growthTypes";
import { classifyOutcome } from "./growthTypes";

export type OutcomeInput = {
  mission: GrowthMission;
  measuredAt?: string;
  confidence: number;
  metrics: GrowthOutcome["metrics"];
  evidence?: string[];
};

function firstDelta(metrics: GrowthOutcome["metrics"]): number | undefined {
  for (const metric of Object.values(metrics)) {
    if (metric.delta !== undefined) return metric.delta;
    if (metric.before !== undefined && metric.after !== undefined) return metric.after - metric.before;
  }
  return undefined;
}

export function recordMissionOutcome(input: OutcomeInput): GrowthOutcome {
  const delta = firstDelta(input.metrics);
  return {
    missionId: input.mission.id,
    measuredAt: input.measuredAt ?? new Date().toISOString(),
    status: classifyOutcome(input.confidence, delta),
    metrics: input.metrics,
    evidence: input.evidence,
    confidence: Math.max(0, Math.min(1, input.confidence)),
  };
}
