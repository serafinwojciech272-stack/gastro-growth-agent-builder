export type AgentMetric = { name: "run_latency" | "tool_latency" | "failure_rate" | "approval_rate" | "outcome_rate"; value: number; timestamp: string; tags?: Record<string, string> };

export interface AgentMetricsSink { record(metric: AgentMetric): Promise<void>; }

export class InMemoryAgentMetrics implements AgentMetricsSink {
  readonly metrics: AgentMetric[] = [];
  async record(metric: AgentMetric): Promise<void> { this.metrics.push(metric); }
}

export function calculateFailureRate(completed: number, failed: number): number {
  const total = completed + failed;
  return total === 0 ? 0 : failed / total;
}
