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
  const intelligence = buildBusinessIntelligence(input);
  const trace: CoreTraceEvent[] = [
    traceEvent(runId, "context", "context.accepted", { businessId: input.context.business.id }),
    traceEvent(runId, "signal", "signals.scoped", { count: input.signals.filter((signal) => signal.businessId === input.context.business.id).length }),
    traceEvent(runId, "evidence", "evidence.built", { count: intelligence.evidence.length }),
    traceEvent(runId, "diagnosis", "diagnosis.built", { count: intelligence.diagnoses.length }),
    traceEvent(runId, "opportunity", "opportunities.built", { count: intelligence.opportunities.length }),
    traceEvent(runId, "recommendation", "recommendations.built", { count: intelligence.recommendations.length }),
    traceEvent(runId, "priority", "priorities.calculated", { count: intelligence.priorities.length }),
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
