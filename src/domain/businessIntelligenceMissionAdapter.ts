import type { BusinessContext, BusinessSignal, Recommendation } from "./universalBusinessCore";
import type { GrowthAction, GrowthDecisionContext, GrowthKpi } from "./growthTypes";
import type { OpportunitySignal } from "./growthDecisionEngine";
import { getVerticalConfig } from "../config/verticals";

/**
 * Bridge from the universal Business Intelligence domain to the existing
 * Growth/Mission Control Plane. This translates contracts; it does not create
 * a second mission engine.
 */
export type MissionAdapterInput = {
  context: BusinessContext;
  signals: readonly BusinessSignal[];
  recommendations: readonly Recommendation[];
};

export type MissionAdapterOutput = {
  decisionContext: GrowthDecisionContext;
  opportunitySignals: OpportunitySignal[];
  actions: GrowthAction[];
};

const asVertical = (context: BusinessContext): GrowthDecisionContext["vertical"] =>
  getVerticalConfig(context.business.industry).id;

const signalToKpi = (signal: BusinessSignal): GrowthKpi => ({
  key: signal.metric ?? signal.type,
  label: signal.metric ?? signal.type,
  unit: typeof signal.value === "number" ? "ratio" : "score",
  baseline: signal.baseline,
  current: typeof signal.value === "number" ? signal.value : undefined,
});

const recommendationForSignal = (
  recommendations: readonly Recommendation[],
  signal: BusinessSignal,
): Recommendation | undefined => recommendations.find(
  (item) => item.businessId === signal.businessId && item.opportunityId === `opportunity:${signal.id}`,
);

const recommendationToOpportunity = (
  recommendation: Recommendation | undefined,
  signal: BusinessSignal,
): OpportunitySignal => ({
  id: recommendation?.id ?? `opportunity:${signal.id}`,
  title: recommendation?.title ?? `Improve ${signal.metric ?? signal.type}`,
  rationale: recommendation?.rationale ?? `Investigate and improve ${signal.metric ?? signal.type} using available evidence.`,
  impactScore: Math.min(100, Math.round(Math.abs(signal.deviation ?? 0) * 2)),
  confidence: Math.max(0, Math.min(1, signal.confidence <= 1 ? signal.confidence : signal.confidence / 100)),
  effortScore: 50,
  risk: "medium",
  relatedKpis: [signal.metric ?? signal.type],
});

const actionFor = (recommendation: Recommendation | undefined, signal: BusinessSignal, index: number): GrowthAction => ({
  id: `bi-action:${signal.id}:${index + 1}`,
  title: recommendation?.actions[index] ?? `Investigate ${signal.metric ?? signal.type}`,
  description: recommendation?.rationale ?? `Prepare a controlled action for ${signal.metric ?? signal.type}.`,
  risk: "medium",
  autonomyLevel: 1,
  requiresApproval: true,
  expectedImpact: recommendation?.expectedOutcome,
  rollbackStrategy: "Revert the prepared change and verify the KPI against the prior baseline.",
});

export function adaptBusinessIntelligenceToMission(input: MissionAdapterInput): MissionAdapterOutput {
  const { context, signals, recommendations } = input;
  const materialSignals = signals.filter(
    (signal) => signal.deviation !== undefined && Math.abs(signal.deviation) >= 10,
  );
  const kpis = signals.map(signalToKpi);
  const opportunitySignals = materialSignals.map((signal) =>
    recommendationToOpportunity(recommendationForSignal(recommendations, signal), signal),
  );
  const actions = materialSignals.flatMap((signal) => {
    const recommendation = recommendationForSignal(recommendations, signal);
    const actionCount = recommendation?.actions.length ?? 3;
    return Array.from({ length: actionCount }, (_, index) => actionFor(recommendation, signal, index));
  });

  const decisionContext: GrowthDecisionContext = {
    vertical: asVertical(context),
    businessId: context.business.id,
    objective: context.business.goals[0]?.title ?? `Improve ${context.business.name}`,
    kpis,
    recentOutcomes: [],
  };

  return { decisionContext, opportunitySignals, actions };
}
