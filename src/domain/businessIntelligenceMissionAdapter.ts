import type { BusinessContext, BusinessSignal, Recommendation } from "./businessIntelligenceContracts";
import type { GrowthAction, GrowthDecisionContext, GrowthKpi } from "./growthTypes";
import type { OpportunitySignal } from "./growthDecisionEngine";
import { getVerticalConfig } from "../config/verticals";

/**
 * Bridge from the universal Business Intelligence domain to the existing
 * Growth/Mission Control Plane. This deliberately does not create a second
 * mission engine: it only translates typed intelligence into the contracts
 * consumed by the existing autoMissionPipeline/agentControlPlane.
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

const asVertical = (context: BusinessContext): GrowthDecisionContext["vertical"] => {
  const candidate = context.vertical ?? context.industry;
  return getVerticalConfig(candidate).id;
};

const signalToKpi = (signal: BusinessSignal): GrowthKpi => ({
  key: signal.metric,
  label: signal.metric,
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
  title: recommendation?.title ?? `Improve ${signal.metric}`,
  rationale: recommendation?.rationale ?? `Investigate and improve ${signal.metric} using the available evidence.`,
  impactScore: Math.min(100, Math.round(Math.abs(signal.deltaPercent ?? 0) * 2)),
  confidence: signal.confidence === "high" ? 0.9 : signal.confidence === "medium" ? 0.7 : 0.45,
  effortScore: 50,
  risk: recommendation?.risk === "high" || recommendation?.risk === "critical" ? "high" : recommendation?.risk === "medium" ? "medium" : "low",
  relatedKpis: [signal.metric],
});

const actionFor = (recommendation: Recommendation | undefined, signal: BusinessSignal, index: number): GrowthAction => ({
  id: `bi-action:${signal.id}:${index + 1}`,
  title: recommendation?.actions[index] ?? `Investigate ${signal.metric}`,
  description: recommendation?.rationale ?? `Prepare a controlled action for ${signal.metric}.`,
  risk: recommendation?.risk === "high" || recommendation?.risk === "critical" ? "high" : "medium",
  autonomyLevel: 1,
  requiresApproval: true,
  expectedImpact: recommendation?.expectedOutcome,
  rollbackStrategy: "Revert the prepared change and verify the KPI against the prior baseline.",
});

export function adaptBusinessIntelligenceToMission(input: MissionAdapterInput): MissionAdapterOutput {
  const { context, signals, recommendations } = input;
  const materialSignals = signals.filter(
    (signal) => signal.deltaPercent !== undefined && Math.abs(signal.deltaPercent) >= 10,
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
    businessId: context.businessId,
    objective: context.goals?.[0] ?? `Improve ${context.name}`,
    kpis,
    recentOutcomes: [],
  };

  return { decisionContext, opportunitySignals, actions };
}
