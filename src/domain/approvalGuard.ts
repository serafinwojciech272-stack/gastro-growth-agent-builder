import type { GrowthAction, GrowthMission } from "./growthTypes";

export type ApprovalDecision = { allowed: boolean; reason: string };

export function evaluateApproval(mission: GrowthMission, action: GrowthAction): ApprovalDecision {
  if (mission.status === "cancelled" || mission.status === "completed") return { allowed: false, reason: "Mission is terminal" };
  if (action.risk === "high" || action.requiresApproval || action.autonomyLevel >= 4) return { allowed: false, reason: "Human approval required" };
  return { allowed: true, reason: "Action is within autonomous execution policy" };
}
