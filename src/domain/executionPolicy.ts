import type { GrowthAction, GrowthMission } from "./growthTypes";

export type ExecutionPolicyDecision = {
  allowed: boolean;
  reason: string;
};

export function evaluateExecutionPolicy(mission: GrowthMission, action: GrowthAction): ExecutionPolicyDecision {
  if (mission.status !== "approved") return { allowed: false, reason: "Mission is not approved" };
  if (action.requiresApproval) return { allowed: false, reason: "Action requires explicit approval" };
  if (action.autonomyLevel < 3) return { allowed: false, reason: "Action autonomy level is below execution threshold" };
  if (action.risk === "high") return { allowed: false, reason: "High-risk actions require human review" };
  return { allowed: true, reason: "Action satisfies autonomous execution policy" };
}
