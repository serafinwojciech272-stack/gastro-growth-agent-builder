import type { GrowthDecisionContext, GrowthMission, GrowthOutcome } from "./growthTypes";
import type { OpportunitySignal } from "./growthDecisionEngine";
import type { GrowthAction } from "./growthTypes";
import { autoCreateMission } from "./autoMissionPipeline";
import type { MissionPersistence } from "./missionPersistence";
import { runLearningCycle, type AgentCycle } from "./agentLoop";

export type AgentRunStatus = "idle" | "planning" | "awaiting_approval" | "executing" | "measuring" | "learning" | "completed" | "failed";

export type AgentRunSnapshot = {
  runId: string;
  status: AgentRunStatus;
  missionId?: string;
  startedAt: string;
  finishedAt?: string;
  error?: string;
};

export type AgentControlPlane = {
  createMission: (context: GrowthDecisionContext, signals: readonly OpportunitySignal[], actions: readonly GrowthAction[], store: MissionPersistence) => Promise<{ run: AgentRunSnapshot; mission: GrowthMission }>;
  learn: (context: GrowthDecisionContext, mission: GrowthMission, outcomes: readonly GrowthOutcome[]) => AgentCycle;
};

export function createAgentControlPlane(): AgentControlPlane {
  return {
    async createMission(context, signals, actions, store) {
      const run: AgentRunSnapshot = { runId: crypto.randomUUID(), status: "planning", startedAt: new Date().toISOString() };
      try {
        const { mission } = await autoCreateMission(context, signals, actions, store);
        return { run: { ...run, status: "awaiting_approval", missionId: mission.id }, mission };
      } catch (error) {
        return { run: { ...run, status: "failed", finishedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error) }, mission: undefined as never };
      }
    },
    learn(context, mission, outcomes) {
      return runLearningCycle(context, mission, outcomes);
    },
  };
}
