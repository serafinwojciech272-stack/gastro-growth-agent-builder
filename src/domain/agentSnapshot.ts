import type { GrowthMission, GrowthOutcome } from "./growthTypes";
import type { AgentMetric } from "./agentObservability";
import { calculateAgentHealth, type AgentHealthSnapshot } from "./agentHealth";

export type AgentSnapshot = {
  generatedAt: string;
  health: AgentHealthSnapshot;
  activeMissions: GrowthMission[];
  recentOutcomes: GrowthOutcome[];
  recentMetrics: AgentMetric[];
};

export function buildAgentSnapshot(
  missions: readonly GrowthMission[],
  outcomes: readonly GrowthOutcome[],
  metrics: readonly AgentMetric[],
): AgentSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    health: calculateAgentHealth(missions, metrics),
    activeMissions: missions.filter((mission) => mission.status === "executing" || mission.status === "measuring"),
    recentOutcomes: [...outcomes].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)).slice(0, 10),
    recentMetrics: [...metrics].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20),
  };
}
