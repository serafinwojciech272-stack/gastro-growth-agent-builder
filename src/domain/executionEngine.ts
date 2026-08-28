import type { GrowthAction, GrowthMission } from "./growthTypes";
import { evaluateExecutionPolicy } from "./executionPolicy";
import { transitionMission } from "./missionStateMachine";

export type ExecutionResult = {
  actionId: string;
  status: "completed" | "failed" | "skipped";
  output?: Record<string, unknown>;
  error?: string;
};

export type ActionExecutor = (action: GrowthAction, mission: GrowthMission) => Promise<ExecutionResult>;

export async function executeMission(
  mission: GrowthMission,
  executor: ActionExecutor,
): Promise<{ mission: GrowthMission; results: ExecutionResult[] }> {
  if (mission.status !== "approved") throw new Error(`Mission ${mission.id} must be approved before execution`);

  let executing = transitionMission(mission, "START_EXECUTION");
  const results: ExecutionResult[] = [];

  for (const action of executing.actions) {
    const policy = evaluateExecutionPolicy(executing, action);
    if (!policy.allowed) {
      results.push({ actionId: action.id, status: "skipped", error: policy.reason });
      continue;
    }

    try {
      results.push(await executor(action, executing));
    } catch (error) {
      results.push({ actionId: action.id, status: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }

  const failed = results.some((result) => result.status === "failed");
  if (failed) return { mission: transitionMission(executing, "FAIL"), results };

  const blocked = results.some((result) => result.status === "skipped");
  if (blocked) return { mission: transitionMission(executing, "ESCALATE"), results };

  executing = transitionMission(executing, "START_MEASUREMENT");
  return { mission: executing, results };
}
