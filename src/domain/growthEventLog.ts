import type { GrowthOutcome, GrowthMission } from "./growthTypes";
import type { MissionEvent } from "./missionStateMachine";

export type GrowthEventType =
  | "mission.created"
  | "mission.approval_requested"
  | "mission.approved"
  | "mission.rejected"
  | "mission.executing"
  | "mission.measuring"
  | "mission.completed"
  | "mission.cancelled"
  | "outcome.recorded";

export type GrowthEvent = {
  id: string;
  missionId: string;
  type: GrowthEventType;
  timestamp: string;
  actor: "system" | "customer" | "ai";
  metadata?: Record<string, unknown>;
};

const eventMap: Partial<Record<MissionEvent, GrowthEventType>> = {
  SUBMIT_FOR_APPROVAL: "mission.approval_requested",
  APPROVE: "mission.approved",
  REJECT: "mission.rejected",
  START_EXECUTION: "mission.executing",
  START_MEASUREMENT: "mission.measuring",
  COMPLETE: "mission.completed",
  CANCEL: "mission.cancelled",
};

export function createMissionEvent(
  mission: GrowthMission,
  event: MissionEvent,
  actor: GrowthEvent["actor"] = "system",
): GrowthEvent {
  const type = eventMap[event];
  if (!type) throw new Error(`No event mapping for ${event}`);
  return {
    id: crypto.randomUUID(),
    missionId: mission.id,
    type,
    timestamp: new Date().toISOString(),
    actor,
  };
}

export function createOutcomeEvent(outcome: GrowthOutcome, actor: GrowthEvent["actor"] = "system"): GrowthEvent {
  return {
    id: crypto.randomUUID(),
    missionId: outcome.missionId,
    type: "outcome.recorded",
    timestamp: outcome.measuredAt,
    actor,
    metadata: { status: outcome.status, confidence: outcome.confidence },
  };
}
