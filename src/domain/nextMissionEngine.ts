import type { GrowthOutcome } from "./growthTypes";
import type { LearningMemory } from "./learningEngine";

export type NextMissionProposal = { objective: string; rationale: string; confidence: number; sourceOutcomeIds: string[]; kpi: string };

export function proposeNextMission(outcomes: readonly GrowthOutcome[], memory: readonly LearningMemory[]): NextMissionProposal | null {
  if (!outcomes.length || !memory.length) return null;
  const learning = [...memory].sort((a, b) => b.confidence - a.confidence)[0];
  const relevant = outcomes.filter((o) => Object.prototype.hasOwnProperty.call(o.metrics, learning.kpi));
  if (!relevant.length) return null;
  const needsChange = relevant.some((o) => o.status === "negative" || o.status === "no_impact");
  return {
    objective: needsChange ? `Improve ${learning.kpi} using a new strategy` : `Scale the proven improvement in ${learning.kpi}`,
    rationale: learning.recommendation,
    confidence: Math.min(1, learning.confidence * Math.min(1, relevant.length / 3)),
    sourceOutcomeIds: relevant.slice(0, 5).map((o) => `${o.missionId}:${o.actionId ?? "mission"}`),
    kpi: learning.kpi,
  };
}
