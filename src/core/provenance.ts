import type { CoreStage, CoreTraceEvent, Provenance, TruthStatus } from "./contracts";

export type ProvenanceInput = {
  source: string;
  sourceId?: string;
  observedAt?: string;
  truthStatus: TruthStatus;
  lineageIds?: readonly string[];
};

export function createProvenance(input: ProvenanceInput): Provenance {
  return {
    source: input.source,
    ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    ...(input.observedAt ? { observedAt: input.observedAt } : {}),
    truthStatus: input.truthStatus,
    ...(input.lineageIds?.length ? { lineageIds: [...input.lineageIds] } : {}),
  };
}

export function attachProvenance(event: CoreTraceEvent, provenance: readonly ProvenanceInput[]): CoreTraceEvent {
  return {
    ...event,
    provenance: provenance.map(createProvenance),
  };
}

export function validateTrace(trace: readonly CoreTraceEvent[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  let previousTime = "";
  const stageOrder: CoreStage[] = [
    "context", "signal", "evidence", "diagnosis", "opportunity", "recommendation", "priority",
    "mission_intent", "approval", "execution", "measurement", "outcome", "learning",
  ];
  const order = new Map(stageOrder.map((stage, index) => [stage, index]));

  for (const event of trace) {
    if (seen.has(event.id)) errors.push(`duplicate_event_id:${event.id}`);
    seen.add(event.id);
    if (!event.runId) errors.push(`missing_run_id:${event.id}`);
    if (!event.timestamp || Number.isNaN(Date.parse(event.timestamp))) errors.push(`invalid_timestamp:${event.id}`);
    if (previousTime && event.timestamp < previousTime) errors.push(`non_monotonic_timestamp:${event.id}`);
    previousTime = event.timestamp;
    if (event.provenance?.some((item) => !item.source || !item.truthStatus)) errors.push(`invalid_provenance:${event.id}`);
    if (event.provenance?.some((item) => item.truthStatus === "observed" && !item.observedAt)) errors.push(`observed_without_observed_at:${event.id}`);
  }

  for (let index = 1; index < trace.length; index += 1) {
    const previous = order.get(trace[index - 1].stage) ?? -1;
    const current = order.get(trace[index].stage) ?? -1;
    if (current < previous) errors.push(`stage_regression:${trace[index - 1].stage}->${trace[index].stage}`);
  }

  return errors;
}

export function replayTrace(trace: readonly CoreTraceEvent[]): CoreTraceEvent[] {
  return [...trace].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
