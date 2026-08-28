export type AgentEventName = "decision" | "mission" | "action" | "execution" | "measurement" | "learning" | "error";

export type AgentTelemetryEvent = {
  name: AgentEventName;
  timestamp: string;
  missionId?: string;
  actionId?: string;
  durationMs?: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
};

export interface AgentTelemetry { track(event: AgentTelemetryEvent): Promise<void>; }

export class InMemoryAgentTelemetry implements AgentTelemetry {
  readonly events: AgentTelemetryEvent[] = [];
  async track(event: AgentTelemetryEvent): Promise<void> { this.events.push(event); }
  summary() {
    const completed = this.events.filter((event) => event.name === "execution" && event.success !== undefined);
    const successful = completed.filter((event) => event.success === true);
    const durations = completed.map((event) => event.durationMs).filter((value): value is number => typeof value === "number");
    return { totalEvents: this.events.length, completedExecutions: completed.length, successRate: completed.length ? successful.length / completed.length : 0, averageDurationMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0, errors: this.events.filter((event) => event.name === "error").length };
  }
}
