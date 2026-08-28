import type { GrowthAction, GrowthMission } from "./growthTypes";
import { evaluateExecutionPolicy } from "./executionPolicy";

export type ExecutionPlan = {
  missionId: string;
  executable: GrowthAction[];
  blocked: Array<{ action: GrowthAction; reason: string }>;
};

export function buildExecutionPlan(mission: GrowthMission): ExecutionPlan {
  const executable: GrowthAction[] = [];
  const blocked: ExecutionPlan["blocked"] = [];

  for (const action of mission.actions) {
    const decision = evaluateExecutionPolicy(mission, action);
    if (decision.allowed) executable.push(action);
    else blocked.push({ action, reason: decision.reason });
  }

  return { missionId: mission.id, executable, blocked };
}
