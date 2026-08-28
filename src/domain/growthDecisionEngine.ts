import type { GrowthAction, GrowthDecisionContext, GrowthMission } from "./growthTypes";

export type OpportunitySignal = {
  id: string;
  title: string;
  rationale: string;
  impactScore: number;
  confidence: number;
  effortScore: number;
  risk: "low" | "medium" | "high";
  relatedKpis: string[];
};

export type GrowthDecision = {
  primaryOpportunity: OpportunitySignal;
  recommendedMission: Pick<GrowthMission, "objective" | "expectedImpact" | "confidence">;
  actions: GrowthAction[];
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function rankOpportunities(signals: readonly OpportunitySignal[]): OpportunitySignal[] {
  return [...signals].sort((a, b) => {
    const scoreA = a.impactScore * 0.45 + a.confidence * 100 * 0.35 - a.effortScore * 0.2;
    const scoreB = b.impactScore * 0.45 + b.confidence * 100 * 0.35 - b.effortScore * 0.2;
    return scoreB - scoreA;
  });
}

export function createGrowthDecision(
  context: GrowthDecisionContext,
  signals: readonly OpportunitySignal[],
  actions: readonly GrowthAction[],
): GrowthDecision | null {
  const ranked = rankOpportunities(signals);
  const primary = ranked[0];
  if (!primary) return null;

  const relevantActions = actions.filter((action) =>
    action.title.toLowerCase().includes(primary.title.toLowerCase().split(" ")[0] ?? ""),
  );

  const confidence = clamp(primary.confidence * 100);

  return {
    primaryOpportunity: primary,
    recommendedMission: {
      objective: primary.title,
      expectedImpact: primary.rationale,
      confidence: confidence / 100,
    },
    actions: relevantActions.length > 0 ? relevantActions : actions.slice(0, 3),
  };
}

export function buildDecisionContext(
  vertical: GrowthDecisionContext["vertical"],
  businessId: string,
  objective: string,
  kpis: GrowthDecisionContext["kpis"],
): GrowthDecisionContext {
  return { vertical, businessId, objective, kpis, recentOutcomes: [] };
}
