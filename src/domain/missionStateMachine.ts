import type { GrowthMission, MissionStatus } from "./growthTypes";

export type MissionEvent =
  | "SUBMIT_FOR_APPROVAL"
  | "APPROVE"
  | "REJECT"
  | "START_EXECUTION"
  | "START_MEASUREMENT"
  | "COMPLETE"
  | "CANCEL";

const transitions: Record<MissionStatus, Partial<Record<MissionEvent, MissionStatus>>> = {
  draft: { SUBMIT_FOR_APPROVAL: "awaiting_approval", CANCEL: "cancelled" },
  awaiting_approval: { APPROVE: "approved", REJECT: "cancelled", CANCEL: "cancelled" },
  approved: { START_EXECUTION: "executing", CANCEL: "cancelled" },
  executing: { START_MEASUREMENT: "measuring", CANCEL: "cancelled" },
  measuring: { COMPLETE: "completed" },
  completed: {},
  cancelled: {},
};

export function transitionMission(mission: GrowthMission, event: MissionEvent): GrowthMission {
  const next = transitions[mission.status][event];
  if (!next) throw new Error(`Invalid mission transition: ${mission.status} + ${event}`);
  return { ...mission, status: next };
}

export function isTerminalMissionStatus(status: MissionStatus): boolean {
  return status === "completed" || status === "cancelled";
}
