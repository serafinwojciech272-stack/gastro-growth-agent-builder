/**
 * Narrow permission boundary between Core governance and the existing execution plane.
 * The Core decides whether an action may be proposed for execution; adapters remain
 * responsible for actually invoking tools and enforcing tenant/runtime credentials.
 */
import type { ActionRisk, AutonomyPolicy, PolicyDecision, PolicyEvaluationInput } from "./policy";
import { evaluatePolicy } from "./policy";

export type ToolCapability = {
  toolId: string;
  description?: string;
  risk: ActionRisk;
  reversible: boolean;
  externalSideEffect: boolean;
};

export type ToolActionRequest = {
  actionId: string;
  toolId: string;
  risk?: ActionRisk;
  irreversible?: boolean;
  externalSideEffect?: boolean;
  requestedAutonomy?: PolicyEvaluationInput["requestedAutonomy"];
};

export type ToolPermissionDecision = PolicyDecision & {
  toolId: string;
};

export type ToolPermissionRegistry = {
  get(toolId: string): ToolCapability | undefined;
};

export function evaluateToolAction(
  request: ToolActionRequest,
  registry: ToolPermissionRegistry,
  policy?: AutonomyPolicy,
): ToolPermissionDecision {
  const capability = registry.get(request.toolId);

  if (!capability) {
    const decision = evaluatePolicy({
      actionId: request.actionId,
      toolId: request.toolId,
      risk: request.risk ?? "critical",
      irreversible: request.irreversible ?? true,
      externalSideEffect: request.externalSideEffect ?? true,
      requestedAutonomy: request.requestedAutonomy,
    }, policy);
    return {
      ...decision,
      status: "blocked",
      reason: "Tool is not registered in the Core capability registry.",
      toolId: request.toolId,
      allowedTool: false,
      requiresApproval: false,
    };
  }

  const decision = evaluatePolicy({
    actionId: request.actionId,
    toolId: request.toolId,
    risk: request.risk ?? capability.risk,
    irreversible: request.irreversible ?? !capability.reversible,
    externalSideEffect: request.externalSideEffect ?? capability.externalSideEffect,
    requestedAutonomy: request.requestedAutonomy,
  }, policy);

  return { ...decision, toolId: request.toolId };
}
