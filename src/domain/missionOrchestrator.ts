import type { GrowthMission, GrowthOutcome } from "./growthTypes";
import { transitionMission, type MissionEvent } from "./missionStateMachine";
import { classifyOutcome } from "./growthTypes";

export type MissionOrchestrationResult = {
  mission: GrowthMission;
  outcome?: GrowthOutcome;
  nextEvent?: MissionEvent;
};

export function advanceMission(mission: GrowthMission, event: MissionEvent): MissionOrchestrationResult {
  return { mission: transitionMission(mission, event) };
}

export function completeMeasurement(
  mission: GrowthMission,
  actionId: string | undefined,
  kpi: string,
  baseline: number | undefined,
  before: number | undefined,
  after: number | undefined,
  confidence: number,
  evidence: string[] = [],
): MissionOrchestrationResult {
  const delta = before !== undefined && after !== undefined ? after - before : undefined;
  const outcome: GrowthOutcome = {
    missionId: mission.id,
    actionId,
    status: classifyOutcome(confidence, delta),
    measuredAt: new Date().toISOString(),
    metrics: { [kpi]: { baseline, before, after, delta } },
    evidence,
    confidence,
  };
  const nextEvent: MissionEvent = outcome.status === "insufficient_data" ? "ESCALATE" : "COMPLETE";
  return { mission: transitionMission(mission, nextEvent), outcome, nextEvent };
}
