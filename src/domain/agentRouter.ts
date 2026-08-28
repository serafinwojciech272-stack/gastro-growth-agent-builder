export type AgentRole = "advisor" | "diagnostician" | "strategist" | "planner" | "executor" | "analyst" | "critic";

export type AgentTask = { id: string; role: AgentRole; input: Record<string, unknown>; priority: number };

export type AgentRoute = { role: AgentRole; reason: string; priority: number };

export function routeAgentTask(task: AgentTask): AgentRoute {
  const reasons: Record<AgentRole, string> = {
    advisor: "Business context and growth guidance",
    diagnostician: "Identify root causes and opportunities",
    strategist: "Select the highest value growth strategy",
    planner: "Convert strategy into executable actions",
    executor: "Run approved low-risk capabilities",
    analyst: "Measure outcomes and KPI deltas",
    critic: "Challenge quality, risk and assumptions",
  };
  return { role: task.role, reason: reasons[task.role], priority: task.priority };
}

export function createAgentTask(role: AgentRole, input: Record<string, unknown>, priority = 50): AgentTask {
  return { id: crypto.randomUUID(), role, input, priority };
}
