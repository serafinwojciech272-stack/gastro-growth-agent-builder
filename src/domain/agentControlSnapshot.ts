import type { GrowthMission, GrowthOutcome } from "./growthTypes";
import type { AgentMetric } from "./agentObservability";
import { buildAgentSnapshot, type AgentSnapshot } from "./agentSnapshot";

export type AgentControlSnapshot = AgentSnapshot & {
  mode: "autonomous" | "approval_required" | "degraded" | "blocked";
  attentionRequired: boolean;
  attentionReasons: string[];
  nextBestAction: string;
};

export function buildAgentControlSnapshot(
  missions: readonly GrowthMission[],
  outcomes: readonly GrowthOutcome[],
  metrics: readonly AgentMetric[],
): AgentControlSnapshot {
  const snapshot = buildAgentSnapshot(missions, outcomes, metrics);
  const reasons: string[] = [];

  if (snapshot.health.status === "blocked") reasons.push("Agent health is blocked");
  if (snapshot.health.status === "degraded") reasons.push("Agent health is degraded");
  if (missions.some((mission) => mission.status === "human_review")) reasons.push("Human review is required");
  if (missions.some((mission) => mission.status === "awaiting_approval")) reasons.push("Mission approval is pending");
  if (snapshot.recentOutcomes.some((outcome) => outcome.status === "negative")) reasons.push("Recent outcome requires corrective action");

  const mode = snapshot.health.status === "blocked"
    ? "blocked"
    : snapshot.health.status === "degraded"
      ? "degraded"
      : reasons.some((reason) => reason.includes("approval") || reason.includes("review"))
        ? "approval_required"
        : "autonomous";

  const nextBestAction = mode === "blocked"
    ? "Resolve blocking conditions"
    : mode === "degraded"
      ? "Run diagnostics and recover agent health"
      : mode === "approval_required"
        ? "Review pending mission decisions"
        : snapshot.activeMissions.length > 0
          ? "Continue active mission and measure outcome"
          : "Run next business diagnosis";

  return { ...snapshot, mode, attentionRequired: reasons.length > 0, attentionReasons: reasons, nextBestAction };
}
