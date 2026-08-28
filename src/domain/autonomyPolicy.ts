import type { ActionPolicy, AutonomyLevel, GrowthAction } from "./growthTypes";

export type ExecutionDecision = {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
};

const DEFAULT_POLICIES: Record<AutonomyLevel, ActionPolicy> = {
  0: { risk: "low", autonomyLevel: 0, requiresApproval: true },
  1: { risk: "low", autonomyLevel: 1, requiresApproval: true },
  2: { risk: "medium", autonomyLevel: 2, requiresApproval: true },
  3: { risk: "low", autonomyLevel: 3, requiresApproval: false, maxFrequencyPerDay: 10 },
  4: { risk: "medium", autonomyLevel: 4, requiresApproval: false, maxFrequencyPerDay: 5 },
  5: { risk: "high", autonomyLevel: 5, requiresApproval: false, maxFrequencyPerDay: 2 },
};

export function getDefaultActionPolicy(level: AutonomyLevel): ActionPolicy {
  return DEFAULT_POLICIES[level];
}

export function evaluateExecution(
  action: GrowthAction,
  policy: ActionPolicy = getDefaultActionPolicy(action.autonomyLevel),
): ExecutionDecision {
  if (action.requiresApproval || policy.requiresApproval) {
    return { allowed: false, requiresApproval: true, reason: "Customer approval is required before execution." };
  }

  if (action.risk === "high" && action.autonomyLevel < 5) {
    return { allowed: false, requiresApproval: true, reason: "High-risk actions require the highest autonomy policy." };
  }

  if (action.autonomyLevel < 3) {
    return { allowed: false, requiresApproval: true, reason: "Action autonomy level is below the execution threshold." };
  }

  return { allowed: true, requiresApproval: false, reason: "Action satisfies the configured execution policy." };
}
