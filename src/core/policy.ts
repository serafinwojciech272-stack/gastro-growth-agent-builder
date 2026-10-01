/**
 * Reusable governance primitive for the Core AI Engine.
 *
 * This module evaluates whether a proposed action may proceed to the existing
 * Mission/Control/Execution plane. It never executes tools or changes state.
 */
import type { Provenance, TruthStatus } from "./contracts";

export type AutonomyLevel = "advisory" | "assisted" | "controlled" | "autonomous";
export type ActionRisk = "low" | "medium" | "high" | "critical";

export type PolicyVersion = {
  id: string;
  description?: string;
};

export type AutonomyPolicy = {
  version: PolicyVersion;
  defaultAutonomy: AutonomyLevel;
  maxRiskByAutonomy: Record<AutonomyLevel, ActionRisk>;
  requireApprovalForIrreversible: boolean;
  requireApprovalForExternalSideEffect: boolean;
  blockedToolIds?: readonly string[];
  allowedToolIds?: readonly string[];
};

export const DEFAULT_AUTONOMY_POLICY: AutonomyPolicy = {
  version: { id: "autonomy-v1", description: "Conservative governed execution policy" },
  defaultAutonomy: "controlled",
  maxRiskByAutonomy: {
    advisory: "low",
    assisted: "low",
    controlled: "medium",
    autonomous: "medium",
  },
  requireApprovalForIrreversible: true,
  requireApprovalForExternalSideEffect: true,
};

export type PolicyEvaluationInput = {
  actionId: string;
  toolId?: string;
  risk: ActionRisk;
  irreversible?: boolean;
  externalSideEffect?: boolean;
  requestedAutonomy?: AutonomyLevel;
  provenance?: Provenance[];
};

export type PolicyDecision = {
  actionId: string;
  policyVersion: string;
  autonomyLevel: AutonomyLevel;
  status: "allowed" | "requires_approval" | "blocked";
  reason: string;
  risk: ActionRisk;
  irreversible: boolean;
  externalSideEffect: boolean;
  allowedTool: boolean;
  requiresApproval: boolean;
  provenance: Provenance[];
};

const RISK_RANK: Record<ActionRisk, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export function validateAutonomyPolicy(policy: AutonomyPolicy): string[] {
  const errors: string[] = [];
  if (!policy.version.id.trim()) errors.push("policy.version.id is required");
  for (const level of Object.keys(policy.maxRiskByAutonomy) as AutonomyLevel[]) {
    if (!(policy.maxRiskByAutonomy[level] in RISK_RANK)) {
      errors.push(`invalid max risk for autonomy level: ${level}`);
    }
  }
  return errors;
}

export function evaluatePolicy(
  input: PolicyEvaluationInput,
  policy: AutonomyPolicy = DEFAULT_AUTONOMY_POLICY,
): PolicyDecision {
  const validationErrors = validateAutonomyPolicy(policy);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid autonomy policy: ${validationErrors.join("; ")}`);
  }

  const autonomyLevel = input.requestedAutonomy ?? policy.defaultAutonomy;
  const irreversible = input.irreversible ?? false;
  const externalSideEffect = input.externalSideEffect ?? false;
  const blocked = Boolean(input.toolId && policy.blockedToolIds?.includes(input.toolId));
  const allowedTool = !input.toolId || (
    !blocked && (!policy.allowedToolIds || policy.allowedToolIds.includes(input.toolId))
  );
  const riskWithinLimit = RISK_RANK[input.risk] <= RISK_RANK[policy.maxRiskByAutonomy[autonomyLevel]];
  const approvalRequired =
    policy.requireApprovalForIrreversible && irreversible ||
    policy.requireApprovalForExternalSideEffect && externalSideEffect ||
    input.risk === "high";

  let status: PolicyDecision["status"] = "allowed";
  let reason = "Action is within the configured autonomy and tool policy.";

  if (blocked || !allowedTool) {
    status = "blocked";
    reason = blocked ? "Tool is explicitly blocked by policy." : "Tool is not allowed by policy.";
  } else if (input.risk === "critical") {
    status = "blocked";
    reason = "Critical-risk actions are blocked by the Core policy.";
  } else if (!riskWithinLimit) {
    status = "requires_approval";
    reason = "Action risk exceeds the autonomous risk limit for this autonomy level.";
  } else if (autonomyLevel === "advisory" || autonomyLevel === "assisted") {
    status = "requires_approval";
    reason = `Autonomy level '${autonomyLevel}' does not permit unattended execution.`;
  } else if (approvalRequired) {
    status = "requires_approval";
    reason = irreversible
      ? "Irreversible action requires explicit approval."
      : externalSideEffect
        ? "External side effect requires explicit approval."
        : "High-risk action requires explicit approval.";
  }

  const provenance = input.provenance ?? [{
    source: "autonomy_policy",
    sourceId: policy.version.id,
    truthStatus: "calculated" as TruthStatus,
    lineageIds: [input.actionId],
  }];

  return {
    actionId: input.actionId,
    policyVersion: policy.version.id,
    autonomyLevel,
    status,
    reason,
    risk: input.risk,
    irreversible,
    externalSideEffect,
    allowedTool,
    requiresApproval: status === "requires_approval",
    provenance,
  };
}
