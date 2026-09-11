import type { Opportunity } from "./universalBusinessCore";
import { rankOpportunities } from "./universalBusinessCore";
import type { GrowthAction, GrowthDecisionContext } from "./growthTypes";
import type { GrowthDecision, OpportunitySignal } from "./growthDecisionEngine";

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

export function createGrowthDecisionFromUniversal(
  context: GrowthDecisionContext,
  opportunities: readonly Opportunity[],
  actions: readonly GrowthAction[],
): GrowthDecision | null {
  const rankedUniversal = rankOpportunities(opportunities).filter((score) => score.rank !== undefined);
  const ordered = rankedUniversal.map((score) => opportunities.find((opportunity) => opportunity.id === score.opportunityId)).filter((opportunity): opportunity is Opportunity => Boolean(opportunity));
  const primary = ordered[0];
  if (!primary) return null;

  const primaryKpis = new Set(primary.relatedKpis.map((kpi) => kpi.toLowerCase()));
  const relevantActions = actions.filter((action) => [...primaryKpis].some((kpi) => action.title.toLowerCase().includes(kpi)));
  const primarySignal = toLegacyOpportunity(primary);

  return {
    primaryOpportunity: primarySignal,
    rankedOpportunities: ordered.map(toLegacyOpportunity),
    recommendedMission: {
      objective: primary.title,
      expectedImpact: primary.expectedOutcome ?? primary.description,
      confidence: primary.confidence <= 1 ? primary.confidence : primary.confidence / 100,
    },
    actions: relevantActions.length > 0 ? relevantActions : actions.slice(0, 3),
  };
}
