import type { GrowthMission } from "./growthTypes";
import { transitionMission, type MissionEvent } from "./missionStateMachine";

export function advanceMission(mission: GrowthMission, event: MissionEvent): GrowthMission {
  return transitionMission(mission, event);
}

export function submitMissionForApproval(mission: GrowthMission): GrowthMission {
  return advanceMission(mission, "SUBMIT_FOR_APPROVAL");
}

export function approveMissionForExecution(mission: GrowthMission): GrowthMission {
  return advanceMission(mission, "APPROVE");
}

export function beginExecution(mission: GrowthMission): GrowthMission {
  return advanceMission(mission, "START_EXECUTION");
}

export function beginMeasurement(mission: GrowthMission): GrowthMission {
  return advanceMission(mission, "START_MEASUREMENT");
}

export function completeMission(mission: GrowthMission): GrowthMission {
  return advanceMission(mission, "COMPLETE");
}

export function cancelMission(mission: GrowthMission): GrowthMission {
  return advanceMission(mission, "CANCEL");
}
