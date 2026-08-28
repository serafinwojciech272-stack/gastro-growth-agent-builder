import type { GrowthMission } from "./growthTypes";
import type { AgentMetric } from "./agentObservability";

export type AgentHealth = "healthy" | "degraded" | "blocked" | "idle";

export type AgentHealthSnapshot = {
  status: AgentHealth;
  score: number;
  activeMissions: number;
  failedMissions: number;
  failureRate: number;
  outcomeRate: number;
  lastActivityAt?: string;
  reasons: string[];
};

export function calculateAgentHealth(
  missions: readonly GrowthMission[],
  metrics: readonly AgentMetric[],
): AgentHealthSnapshot {
  const activeMissions = missions.filter((m) => m.status === "executing" || m.status === "measuring").length;
  const failedMissions = missions.filter((m) => m.status === "failed").length;
  const completedMissions = missions.filter((m) => m.status === "completed").length;
  const totalTerminal = failedMissions + completedMissions;
  const failureRate = totalTerminal ? failedMissions / totalTerminal : 0;
  const outcomeMetric = [...metrics].reverse().find((m) => m.name === "outcome_rate");
  const outcomeRate = outcomeMetric?.value ?? (completedMissions ? completedMissions / Math.max(1, missions.length) : 0);
  const lastActivityAt = metrics.length ? metrics.reduce((latest, m) => m.timestamp > latest ? m.timestamp : latest, metrics[0].timestamp) : undefined;

  const reasons: string[] = [];
  if (failureRate >= 0.35) reasons.push("High mission failure rate");
  if (activeMissions > 3) reasons.push("Too many concurrent active missions");
  if (outcomeRate < 0.4 && totalTerminal >= 3) reasons.push("Low outcome rate");

  const score = Math.max(0, Math.min(100, Math.round(100 - failureRate * 60 - (activeMissions > 3 ? 20 : 0) - (outcomeRate < 0.4 && totalTerminal >= 3 ? 20 : 0))));
  const status: AgentHealth = reasons.length === 0 ? (missions.length ? "healthy" : "idle") : score < 50 ? "blocked" : "degraded";

  return { status, score, activeMissions, failedMissions, failureRate, outcomeRate, lastActivityAt, reasons };
}
