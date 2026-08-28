import type { AgentRole, AgentTask } from "./agentRouter";
import { createAgentTask } from "./agentRouter";

export type AgentWorkflowNode = { id: string; role: AgentRole; next: string[] };

export const DEFAULT_AGENT_GRAPH: readonly AgentWorkflowNode[] = [
  { id: "diagnose", role: "diagnostician", next: ["strategy", "critic"] },
  { id: "strategy", role: "strategist", next: ["plan", "critic"] },
  { id: "critic", role: "critic", next: ["plan"] },
  { id: "plan", role: "planner", next: ["approve"] },
  { id: "approve", role: "advisor", next: ["execute"] },
  { id: "execute", role: "executor", next: ["measure"] },
  { id: "measure", role: "analyst", next: ["learn"] },
  { id: "learn", role: "advisor", next: ["diagnose"] },
];

export function nextTasks(nodeId: string, input: Record<string, unknown>, graph = DEFAULT_AGENT_GRAPH): AgentTask[] {
  const node = graph.find((item) => item.id === nodeId);
  if (!node) throw new Error(`Unknown workflow node: ${nodeId}`);
  return node.next.map((nextId) => {
    const next = graph.find((item) => item.id === nextId);
    if (!next) throw new Error(`Unknown workflow target: ${nextId}`);
    return createAgentTask(next.role, { ...input, parentNode: nodeId }, 50);
  });
}
