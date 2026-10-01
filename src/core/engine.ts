import type { IntelligencePipelineInput, IntelligencePipelineResult } from "../domain/businessIntelligencePipeline";
import type { BusinessContext, BusinessSignal } from "./contracts";
import { UNIVERSAL_CORE_CONTRACT_VERSION, type CoreRun, type CoreTraceEvent } from "./contracts";
import { growthAdvisorReasoningProvider, type CoreReasoningProvider } from "./reasoningProvider";
import { attachProvenance, validateTrace } from "./provenance";

export type CoreEngineInput = IntelligencePipelineInput;
export type CoreEngineResult = IntelligencePipelineResult & { run: CoreRun };

function traceEvent(
  runId: string,
  stage: CoreTraceEvent["stage"],
  eventType: string,
  payload: Record<string, unknown>,
): CoreTraceEvent {
  return {
    id: `${runId}:${stage}`,
    runId,
    stage,
    eventType,
    timestamp: new Date().toISOString(),
    payload,
  };
}

/**
 * Reusable Core AI Engine entry point for the reasoning spine.
 *
 * The default provider is the current Growth Advisor pipeline. A caller may
 * inject another provider without changing Core orchestration or contracts.
 */
export function runCoreEngine(
  input: CoreEngineInput,
  provider: CoreReasoningProvider = growthAdvisorReasoningProvider,
): CoreEngineResult {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const scopedSignals = input.signals.filter((signal) => signal.businessId === input.context.business.id);
  const intelligence = provider(input);
  const trace: CoreTraceEvent[] = [
    attachProvenance(traceEvent(runId, "context", "context.accepted", {
      businessId: input.context.business.id,
      contextUpdatedAt: input.context.lastUpdatedAt,
    }), [{ source: "business_context", sourceId: input.context.business.id, observedAt: input.context.lastUpdatedAt, truthStatus: "observed" }]),
    attachProvenance(traceEvent(runId, "signal", "signals.scoped", {
      count: scopedSignals.length,
      signalIds: scopedSignals.map((signal) => signal.id),
      sourceIds: scopedSignals.map((signal) => signal.source),
    }), scopedSignals.map((signal) => ({ source: signal.source, sourceId: signal.id, observedAt: signal.observedAt, truthStatus: "observed" }))),
    attachProvenance(traceEvent(runId, "evidence", "evidence.built", {
      count: intelligence.evidence.length,
      evidenceIds: intelligence.evidence.map((item) => item.id),
      supportingSignalIds: intelligence.evidence.flatMap((item) => item.supportingSignalIds ?? []),
    }), intelligence.evidence.map((item) => ({ source: "intelligence_pipeline", sourceId: item.id, truthStatus: "calculated", lineageIds: item.supportingSignalIds ?? [] }))),
    attachProvenance(traceEvent(runId, "diagnosis", "diagnosis.built", {
      count: intelligence.diagnoses.length,
      diagnosisIds: intelligence.diagnoses.map((item) => item.id),
      evidenceIds: intelligence.diagnoses.flatMap((item) => item.evidenceIds),
    }), intelligence.diagnoses.map((item) => ({ source: "intelligence_pipeline", sourceId: item.id, truthStatus: "calculated", lineageIds: item.evidenceIds }))),
    attachProvenance(traceEvent(runId, "opportunity", "opportunities.built", {
      count: intelligence.opportunities.length,
      opportunityIds: intelligence.opportunities.map((item) => item.id),
      diagnosisIds: intelligence.opportunities.map((item) => item.sourceDiagnosisId).filter(Boolean),
    }), intelligence.opportunities.map((item) => ({ source: "intelligence_pipeline", sourceId: item.id, truthStatus: "calculated", lineageIds: item.sourceDiagnosisId ? [item.sourceDiagnosisId] : [] }))),
    attachProvenance(traceEvent(runId, "recommendation", "recommendations.built", {
      count: intelligence.recommendations.length,
      recommendationIds: intelligence.recommendations.map((item) => item.id),
      opportunityIds: intelligence.recommendations.map((item) => item.opportunityId),
    }), intelligence.recommendations.map((item) => ({ source: "intelligence_pipeline", sourceId: item.id, truthStatus: "calculated", lineageIds: [item.opportunityId] }))),
    attachProvenance(traceEvent(runId, "priority", "priorities.calculated", {
      count: intelligence.priorities.length,
      scores: intelligence.priorities.map((item) => ({ opportunityId: item.opportunityId, score: item.score, rank: item.rank, policyVersion: item.policyVersion })),
    }), intelligence.priorities.map((item) => ({ source: "priority_policy", sourceId: item.policyVersion, truthStatus: "calculated", lineageIds: [item.opportunityId] }))),
  ];
  const traceErrors = validateTrace(trace);

  return {
    ...intelligence,
    traceErrors: [...intelligence.traceErrors, ...traceErrors],
    run: {
      id: runId,
      businessId: input.context.business.id,
      contractVersion: UNIVERSAL_CORE_CONTRACT_VERSION,
      startedAt,
      completedAt: new Date().toISOString(),
      status: intelligence.traceErrors.length === 0 && traceErrors.length === 0 ? "completed" : "failed",
      trace,
    },
  };
}

export type { BusinessContext, BusinessSignal };
