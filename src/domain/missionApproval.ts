import type { GrowthMission, MissionStatus } from "./growthTypes";
import { transitionMission } from "./missionStateMachine";

export type ApprovalDecision = "approve" | "reject" | "escalate";

export function applyApprovalDecision(mission: GrowthMission, decision: ApprovalDecision): GrowthMission {
  if (mission.status !== "awaiting_approval" && mission.status !== "human_review") {
    throw new Error(`Mission ${mission.id} is not awaiting approval`);
  }
  if (decision === "approve") return transitionMission(mission, "APPROVE");
  if (decision === "reject") return transitionMission(mission, "REJECT");
  return transitionMission(mission, "ESCALATE");
}

export function requiresHumanApproval(mission: GrowthMission): boolean {
  return mission.status === "awaiting_approval" || mission.status === "human_review" || mission.actions.some((action) => action.requiresApproval || action.risk === "high");
}

export function approvalState(mission: GrowthMission): MissionStatus {
  if (mission.status === "awaiting_approval" || mission.status === "human_review") return mission.status;
  if (requiresHumanApproval(mission) && mission.status === "draft") return "awaiting_approval";
  return mission.status;
}
