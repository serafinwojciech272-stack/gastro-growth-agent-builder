import type { GrowthMission } from "./growthTypes";

export type MissionPriority = { missionId: string; score: number; reasons: string[] };

export function rankMissions(missions: readonly GrowthMission[]): MissionPriority[] {
  return missions.map((mission) => {
    const confidence = mission.confidence ?? 0.5;
    const urgency = mission.deadline ? Math.max(0, 1 - Math.max(0, new Date(mission.deadline).getTime() - Date.now()) / (14 * 86400000)) : 0.3;
    const impact = mission.expectedImpact ? 0.7 : 0.4;
    const riskPenalty = mission.actions.some((a) => a.risk === "high") ? 0.2 : 0;
    const score = Math.round((confidence * 0.35 + urgency * 0.25 + impact * 0.4 - riskPenalty) * 100);
    const reasons = [confidence >= 0.7 ? "high confidence" : "needs evidence", urgency >= 0.7 ? "time sensitive" : "normal urgency", impact >= 0.7 ? "strong expected impact" : "moderate expected impact"];
    if (riskPenalty) reasons.push("high risk requires approval");
    return { missionId: mission.id, score: Math.max(0, Math.min(100, score)), reasons };
  }).sort((a, b) => b.score - a.score);
}
