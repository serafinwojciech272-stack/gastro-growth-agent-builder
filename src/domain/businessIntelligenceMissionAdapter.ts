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

const recommendationFor = (
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
  const kpis = signals.map(signalToKpi);
  const opportunitySignals = signals
    .filter((signal) => signal.deltaPercent !== undefined && Math.abs(signal.deltaPercent) >= 10)
    .map((signal) => recommendationFor(recommendations.find((item) => item.businessId === context.businessId), signal));

  const actions = signals
    .filter((signal) => signal.deltaPercent !== undefined && Math.abs(signal.deltaPercent) >= 10)
    .flatMap((signal) => {
      const recommendation = recommendations.find((item) => item.businessId === context.businessId && item.opportunityId === `opportunity:${signal.id}`);
      return (recommendation?.actions ?? ["Validate diagnosis", "Prepare remediation", "Measure outcome"]).map((_, index) => actionFor(recommendation, signal, index));
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
