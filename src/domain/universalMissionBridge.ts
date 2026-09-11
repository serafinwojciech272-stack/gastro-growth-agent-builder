import type { Opportunity, PriorityScore } from "./universalBusinessCore";
import { rankOpportunities } from "./universalBusinessCore";
import type { GrowthAction, GrowthDecisionContext, GrowthKpi, GrowthMission } from "./growthTypes";
import type { GrowthDecision, OpportunitySignal } from "./growthDecisionEngine";

export type UniversalMissionPlan = {
  mission: GrowthMission;
  priority: PriorityScore;
};

function toLegacyOpportunity(opportunity: Opportunity): OpportunitySignal {
  const risk: OpportunitySignal["risk"] = opportunity.risk >= 67 ? "high" : opportunity.risk >= 34 ? "medium" : "low";
  return {
    id: opportunity.id,
    title: opportunity.title,
    rationale: opportunity.description,
    impactScore: opportunity.impact,
    confidence: opportunity.confidence,
    effortScore: opportunity.effort,
    risk,
    relatedKpis: [...opportunity.relatedKpis],
  };
}

function createId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}:${randomUuid ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
}

export function createGrowthDecisionFromUniversal(
  context: GrowthDecisionContext,
  opportunities: readonly Opportunity[],
  actions: readonly GrowthAction[],
): GrowthDecision | null {
  const scoped = opportunities.filter((opportunity) => opportunity.businessId === context.businessId);
  const rankedUniversal = rankOpportunities(scoped);
  const ordered = rankedUniversal
    .map((score) => scoped.find((opportunity) => opportunity.id === score.opportunityId))
    .filter((opportunity): opportunity is Opportunity => Boolean(opportunity));
  const primary = ordered[0];
  if (!primary) return null;

  const primaryKpis = new Set(primary.relatedKpis.map((kpi) => kpi.toLowerCase()));
  const relevantActions = actions.filter((action) =>
    [...primaryKpis].some((kpi) => action.title.toLowerCase().includes(kpi)),
  );

  return {
    primaryOpportunity: toLegacyOpportunity(primary),
    rankedOpportunities: ordered.map(toLegacyOpportunity),
    recommendedMission: {
      objective: primary.title,
      expectedImpact: primary.expectedOutcome ?? primary.description,
      confidence: primary.confidence <= 1 ? primary.confidence : primary.confidence / 100,
    },
    actions: relevantActions.length > 0 ? relevantActions : actions.slice(0, 3),
  };
}

export function buildGrowthMissionFromUniversal(
  context: GrowthDecisionContext,
  opportunity: Opportunity,
  actions: readonly GrowthAction[],
  measurementKpis: readonly GrowthKpi[],
): UniversalMissionPlan {
  if (opportunity.businessId !== context.businessId) {
    throw new Error("Universal opportunity does not belong to the decision context business.");
  }

  const priority = rankOpportunities([opportunity])[0];
  if (!priority) throw new Error("Unable to score universal opportunity.");

  const primaryKpis = new Set(opportunity.relatedKpis.map((kpi) => kpi.toLowerCase()));
  const selectedActions = actions.filter((action) =>
    [...primaryKpis].some((kpi) => action.title.toLowerCase().includes(kpi)),
  );

  return {
    priority,
    mission: {
      id: createId("mission"),
      businessId: context.businessId,
      vertical: context.vertical,
      objective: opportunity.title,
      baseline: opportunity.description,
      target: opportunity.expectedOutcome,
      deadline: opportunity.timeToResultDays
        ? new Date(Date.now() + opportunity.timeToResultDays * 86_400_000).toISOString()
        : undefined,
      expectedImpact: opportunity.expectedOutcome ?? opportunity.description,
      confidence: opportunity.confidence <= 1 ? opportunity.confidence : opportunity.confidence / 100,
      actions: selectedActions.length > 0 ? selectedActions : actions.slice(0, 3),
      measurementKpis: [...measurementKpis],
      status: "awaiting_approval",
    },
  };
}
