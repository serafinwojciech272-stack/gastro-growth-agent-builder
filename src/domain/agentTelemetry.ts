export type AgentTelemetryEvent = {
  name: "decision" | "mission" | "action" | "execution" | "measurement" | "learning" | "error";
  timestamp: string;
  missionId?: string;
  actionId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

export interface AgentTelemetry {
  track(event: AgentTelemetryEvent): Promise<void>;
}

export class InMemoryAgentTelemetry implements AgentTelemetry {
  readonly events: AgentTelemetryEvent[] = [];
  async track(event: AgentTelemetryEvent): Promise<void> { this.events.push(event); }
}
