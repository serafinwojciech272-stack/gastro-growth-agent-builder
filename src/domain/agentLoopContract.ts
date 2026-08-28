import type { GrowthMission, GrowthOutcome } from "./growthTypes";
import { transitionMission, type MissionEvent } from "./missionStateMachine";
import { evaluateApproval } from "./approvalGuard";

export type AgentLoopDecision = {
  mission: GrowthMission;
  outcome?: GrowthOutcome;
  nextEvent?: MissionEvent;
  blockedReason?: string;
};

export function submitMission(mission: GrowthMission): AgentLoopDecision {
  return { mission: transitionMission(mission, "SUBMIT_FOR_APPROVAL"), nextEvent: "APPROVE" };
}

export function approveAndStart(mission: GrowthMission): AgentLoopDecision {
  const approved = transitionMission(mission, "APPROVE");
  return { mission: transitionMission(approved, "START_EXECUTION"), nextEvent: "START_MEASUREMENT" };
}

export function authorizeAction(mission: GrowthMission, actionId: string): AgentLoopDecision {
  const action = mission.actions.find((candidate) => candidate.id === actionId);
  if (!action) return { mission, blockedReason: `Action ${actionId} not found` };
  const decision = evaluateApproval(mission, action);
  return decision.allowed ? { mission } : { mission, blockedReason: decision.reason };
}
