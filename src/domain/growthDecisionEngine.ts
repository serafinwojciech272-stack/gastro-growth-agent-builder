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
  rankedOpportunities: OpportunitySignal[];
  recommendedMission: Pick<GrowthMission, "objective" | "expectedImpact" | "confidence">;
  actions: GrowthAction[];
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function score(signal: OpportunitySignal): number {
  return clamp(signal.impactScore) * 0.45 + clamp(signal.confidence * 100) * 0.35 - clamp(signal.effortScore) * 0.2;
}

export function rankOpportunities(signals: readonly OpportunitySignal[]): OpportunitySignal[] {
  return [...signals].sort((a, b) => score(b) - score(a));
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
    primary.relatedKpis.some((kpi) => action.title.toLowerCase().includes(kpi.toLowerCase())),
  );

  const confidence = clamp(primary.confidence * 100) / 100;

  return {
    primaryOpportunity: primary,
    rankedOpportunities: ranked,
    recommendedMission: {
      objective: primary.title,
      expectedImpact: primary.rationale,
      confidence,
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
