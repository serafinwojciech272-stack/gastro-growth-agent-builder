import type { GrowthDecisionContext, GrowthMission, GrowthOutcome } from "./growthTypes";
import { runLearningCycle, type AgentCycle } from "./agentLoop";

export type AgentRun = {
  id: string;
  businessId: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "completed" | "failed";
  cycle?: AgentCycle;
  error?: string;
};

export async function completeAgentRun(
  run: AgentRun,
  context: GrowthDecisionContext,
  mission: GrowthMission,
  outcomes: readonly GrowthOutcome[],
): Promise<AgentRun> {
  try {
    return { ...run, status: "completed", finishedAt: new Date().toISOString(), cycle: runLearningCycle(context, mission, outcomes) };
  } catch (error) {
    return { ...run, status: "failed", finishedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) };
  }
}
