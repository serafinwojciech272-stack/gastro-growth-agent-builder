import type { GrowthMission, GrowthOutcome } from "./growthTypes";
import { calculateAgentHealth, type AgentHealthSnapshot } from "./agentHealth";
import type { AgentMetric } from "./agentObservability";

export type AgentRunSnapshot = {
  health: AgentHealthSnapshot;
  activeMission?: GrowthMission;
  recentOutcomes: GrowthOutcome[];
  awaitingApproval: number;
  lastEventAt?: string;
  readiness: "ready" | "attention" | "blocked";
};

export function buildAgentRunSnapshot(
  missions: readonly GrowthMission[],
  outcomes: readonly GrowthOutcome[],
  metrics: readonly AgentMetric[],
): AgentRunSnapshot {
  const health = calculateAgentHealth(missions, metrics);
  const activeMission = missions.find((m) => m.status === "executing" || m.status === "measuring" || m.status === "approved");
  const awaitingApproval = missions.filter((m) => m.status === "awaiting_approval" || m.status === "human_review").length;
  const lastEventAt = metrics.length ? metrics.reduce((latest, m) => m.timestamp > latest ? m.timestamp : latest, metrics[0].timestamp) : undefined;
  const readiness = health.status === "blocked" ? "blocked" : awaitingApproval > 0 || health.status === "degraded" ? "attention" : "ready";
  return { health, activeMission, recentOutcomes: [...outcomes].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)).slice(0, 10), awaitingApproval, lastEventAt, readiness };
}
