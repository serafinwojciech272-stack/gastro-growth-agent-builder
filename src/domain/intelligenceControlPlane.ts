import type { BusinessContext, BusinessSignal, Opportunity, PriorityScore, Recommendation } from "./universalBusinessCore";
import { buildBusinessIntelligence } from "./businessIntelligencePipeline";
import { buildGrowthMissionFromUniversal, type UniversalMissionPlan } from "./universalMissionBridge";
import type { GrowthAction, GrowthDecisionContext, GrowthKpi } from "./growthTypes";

export type IntelligenceControlPlaneInput = {
  context: BusinessContext;
  signals: readonly BusinessSignal[];
  decisionContext: GrowthDecisionContext;
  actions: readonly GrowthAction[];
  measurementKpis: readonly GrowthKpi[];
};

export type IntelligenceControlPlaneResult = {
  priorities: PriorityScore[];
  recommendations: Recommendation[];
  selectedOpportunity?: Opportunity;
  missionPlan?: UniversalMissionPlan;
  traceErrors: string[];
};

export function runIntelligenceControlPlane(input: IntelligenceControlPlaneInput): IntelligenceControlPlaneResult {
  const intelligence = buildBusinessIntelligence({ context: input.context, signals: input.signals });
  const selectedOpportunity = intelligence.priorities[0]
    ? intelligence.opportunities.find((opportunity) => opportunity.id === intelligence.priorities[0].opportunityId)
    : undefined;
  const missionPlan = selectedOpportunity
    ? buildGrowthMissionFromUniversal(input.decisionContext, selectedOpportunity, input.actions, input.measurementKpis)
    : undefined;
  return {
    priorities: intelligence.priorities,
    recommendations: intelligence.recommendations,
    selectedOpportunity,
    missionPlan,
    traceErrors: intelligence.traceErrors,
  };
}
