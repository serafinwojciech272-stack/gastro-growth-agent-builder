import type { GrowthMission } from "./growthTypes";

export type ApprovalDecision = "approve" | "reject";

export type ApprovalResult = {
  mission: GrowthMission;
  decision: ApprovalDecision;
  nextStep: "execution" | "cancelled";
};

export function applyApproval(mission: GrowthMission, decision: ApprovalDecision): ApprovalResult {
  if (mission.status !== "awaiting_approval") {
    throw new Error(`Mission ${mission.id} is not awaiting approval`);
  }

  if (decision === "approve") {
    return {
      mission: { ...mission, status: "approved" },
      decision,
      nextStep: "execution",
    };
  }

  return {
    mission: { ...mission, status: "cancelled" },
    decision,
    nextStep: "cancelled",
  };
}
