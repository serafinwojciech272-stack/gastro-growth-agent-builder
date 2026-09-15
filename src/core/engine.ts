import {
  buildBusinessIntelligence,
  type IntelligencePipelineInput,
  type IntelligencePipelineResult,
} from "../domain/businessIntelligencePipeline";
import type { BusinessContext, BusinessSignal } from "./contracts";
import { UNIVERSAL_CORE_CONTRACT_VERSION, type CoreRun, type CoreTraceEvent } from "./contracts";

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
 * The implementation intentionally delegates to the already-tested universal
 * intelligence pipeline. This creates a stable extraction boundary without
 * introducing a competing diagnosis/opportunity/recommendation engine.
 */
export function runCoreEngine(input: CoreEngineInput): CoreEngineResult {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const scopedSignals = input.signals.filter((signal) => signal.businessId === input.context.business.id);
  const intelligence = buildBusinessIntelligence(input);
  const trace: CoreTraceEvent[] = [
    traceEvent(runId, "context", "context.accepted", {
      businessId: input.context.business.id,
      contextUpdatedAt: input.context.lastUpdatedAt,
    }),
    traceEvent(runId, "signal", "signals.scoped", {
      count: scopedSignals.length,
      signalIds: scopedSignals.map((signal) => signal.id),
      sourceIds: scopedSignals.map((signal) => signal.source),
    }),
    traceEvent(runId, "evidence", "evidence.built", {
      count: intelligence.evidence.length,
      evidenceIds: intelligence.evidence.map((item) => item.id),
      supportingSignalIds: intelligence.evidence.flatMap((item) => item.supportingSignalIds ?? []),
    }),
    traceEvent(runId, "diagnosis", "diagnosis.built", {
      count: intelligence.diagnoses.length,
      diagnosisIds: intelligence.diagnoses.map((item) => item.id),
      evidenceIds: intelligence.diagnoses.flatMap((item) => item.evidenceIds),
    }),
    traceEvent(runId, "opportunity", "opportunities.built", {
      count: intelligence.opportunities.length,
      opportunityIds: intelligence.opportunities.map((item) => item.id),
      diagnosisIds: intelligence.opportunities.map((item) => item.sourceDiagnosisId).filter(Boolean),
    }),
    traceEvent(runId, "recommendation", "recommendations.built", {
      count: intelligence.recommendations.length,
      recommendationIds: intelligence.recommendations.map((item) => item.id),
      opportunityIds: intelligence.recommendations.map((item) => item.opportunityId),
    }),
    traceEvent(runId, "priority", "priorities.calculated", {
      count: intelligence.priorities.length,
      scores: intelligence.priorities.map((item) => ({ opportunityId: item.opportunityId, score: item.score, rank: item.rank, policyVersion: item.policyVersion })),
    }),
  ];

  return {
    ...intelligence,
    run: {
      id: runId,
      businessId: input.context.business.id,
      contractVersion: UNIVERSAL_CORE_CONTRACT_VERSION,
      startedAt,
      completedAt: new Date().toISOString(),
      status: intelligence.traceErrors.length === 0 ? "completed" : "failed",
      trace,
    },
  };
}

export type { BusinessContext, BusinessSignal };
