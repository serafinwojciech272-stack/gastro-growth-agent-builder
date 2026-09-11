import type { GrowthAction, GrowthDecisionContext, GrowthKpi } from "./growthTypes";
import type { BusinessContext, BusinessSignal, Evidence } from "./universalBusinessCore";
import { buildGrowthMissionFromUniversal, type UniversalMissionPlan } from "./universalMissionBridge";
import { collectBusinessSignals, type SignalProducerKind, type SignalProducerResult } from "./businessSignalProducers";
import { runDiagnosticCycle, type DiagnosticCycle, type DiagnosticEngineConfig } from "./universalDiagnosticEngine";
import { validateIntelligenceTraceDetailed, type IntelligenceTraceError } from "./universalBusinessIntelligence";

export type UniversalGrowthIntelligenceInput = {
  business: BusinessContext;
  sources: Partial<Record<SignalProducerKind, unknown>>;
  growthContext?: GrowthDecisionContext;
  actions?: readonly GrowthAction[];
  measurementKpis?: readonly GrowthKpi[];
  diagnosticConfig?: DiagnosticEngineConfig;
};

export type UniversalGrowthIntelligenceCycle = {
  producerResult: SignalProducerResult;
  signals: BusinessSignal[];
  evidence: Evidence[];
  diagnostic: DiagnosticCycle;
  traceErrors: IntelligenceTraceError[];
  mission: UniversalMissionPlan | null;
  readyForApproval: boolean;
};

function normalizeEvidence(businessId: string, evidence: readonly Evidence[]): Evidence[] {
  return [...new Map(
    evidence
      .filter((item) => item.businessId === businessId)
      .map((item) => [item.id, item]),
  ).values()];
}

function normalizeSignals(businessId: string, signals: readonly BusinessSignal[]): BusinessSignal[] {
  return [...new Map(
    signals
      .filter((item) => item.businessId === businessId)
      .map((item) => [item.id, item]),
  ).values()];
}

export function runUniversalGrowthIntelligenceCycle(input: UniversalGrowthIntelligenceInput): UniversalGrowthIntelligenceCycle {
  const businessId = input.business.business.id;
  const producerResult = collectBusinessSignals({ business: input.business }, input.sources);
  const signals = normalizeSignals(businessId, producerResult.signals);
  const producerEvidence = normalizeEvidence(businessId, producerResult.evidence);
  const diagnostic = runDiagnosticCycle(businessId, signals, producerEvidence, input.diagnosticConfig);
  const evidence = normalizeEvidence(businessId, diagnostic.evidence);

  const traceErrors = validateIntelligenceTraceDetailed({
    signals,
    evidence,
    diagnoses: diagnostic.diagnoses,
    opportunities: diagnostic.opportunities,
    recommendations: diagnostic.recommendations,
  }, businessId);

  const topOpportunity = diagnostic.opportunities
    .map((opportunity) => ({ opportunity, priority: diagnostic.priorities.find((score) => score.opportunityId === opportunity.id) }))
    .filter((item) => item.priority)
    .sort((a, b) => (b.priority?.score ?? 0) - (a.priority?.score ?? 0))[0]?.opportunity;

  let mission: UniversalMissionPlan | null = null;
  if (topOpportunity && input.growthContext && input.actions && input.measurementKpis && traceErrors.length === 0) {
    mission = buildGrowthMissionFromUniversal(input.growthContext, topOpportunity, input.actions, input.measurementKpis);
  }

  return {
    producerResult,
    signals,
    evidence,
    diagnostic,
    traceErrors,
    mission,
    readyForApproval: Boolean(mission && mission.mission.status === "awaiting_approval" && traceErrors.length === 0),
  };
}
