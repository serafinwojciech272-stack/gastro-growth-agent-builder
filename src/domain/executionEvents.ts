import type { AgentTelemetry } from "./agentTelemetry";
import type { GrowthEvent, GrowthEventType } from "./growthEventLog";
import type { GrowthEventStore } from "./growthEventStore";

export async function emitExecutionEvent(
  store: GrowthEventStore,
  telemetry: AgentTelemetry,
  event: Omit<GrowthEvent, "id" | "timestamp"> & { type: GrowthEventType },
): Promise<GrowthEvent> {
  const persisted: GrowthEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  await store.append(persisted);
  await telemetry.track({
    name: event.type.startsWith("mission.") ? "mission" : event.type === "outcome.recorded" ? "measurement" : "execution",
    timestamp: persisted.timestamp,
    missionId: event.missionId,
    metadata: event.metadata,
  });
  return persisted;
}
