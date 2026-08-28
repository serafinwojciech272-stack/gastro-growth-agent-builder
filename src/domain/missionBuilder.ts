import type { GrowthAction, GrowthDecisionContext, GrowthMission, GrowthKpi } from "./growthTypes";
import type { GrowthDecision } from "./growthDecisionEngine";

export type MissionBuildOptions = {
  missionId: string;
  deadline?: string;
  target?: string;
  status?: GrowthMission["status"];
};

function selectKpis(context: GrowthDecisionContext, decision: GrowthDecision): GrowthKpi[] {
  const related = new Set(decision.primaryOpportunity.relatedKpis);
  const selected = context.kpis.filter((kpi) => related.has(kpi.key));
  return selected.length > 0 ? selected : context.kpis.slice(0, 3);
}

export function buildGrowthMission(
  context: GrowthDecisionContext,
  decision: GrowthDecision,
  options: MissionBuildOptions,
): GrowthMission {
  const actions: GrowthAction[] = decision.actions.map((action) => ({ ...action }));
  return {
    id: options.missionId,
    vertical: context.vertical,
    objective: decision.recommendedMission.objective,
    baseline: context.kpis.find((kpi) => kpi.key === decision.primaryOpportunity.relatedKpis[0])?.current?.toString(),
    target: options.target,
    deadline: options.deadline,
    expectedImpact: decision.recommendedMission.expectedImpact,
    confidence: decision.recommendedMission.confidence,
    actions,
    measurementKpis: selectKpis(context, decision),
    status: options.status ?? "draft",
  };
}

export function prepareMissionForApproval(mission: GrowthMission): GrowthMission {
  if (mission.status !== "draft") return mission;
  return { ...mission, status: "awaiting_approval" };
}
