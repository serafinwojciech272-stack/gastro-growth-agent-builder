import type { GrowthAction, GrowthMission } from "./growthTypes";
import { evaluateExecutionPolicy } from "./executionPolicy";

export type AutonomyDecision = {
  mode: "autonomous" | "approval_required" | "blocked";
  reason: string;
};

export function decideAutonomy(mission: GrowthMission, action: GrowthAction): AutonomyDecision {
  if (mission.status !== "approved") return { mode: "approval_required", reason: "Mission approval is required" };
  const policy = evaluateExecutionPolicy(mission, action);
  if (!policy.allowed) return { mode: "blocked", reason: policy.reason };
  return { mode: "autonomous", reason: "Policy permits autonomous execution" };
}
