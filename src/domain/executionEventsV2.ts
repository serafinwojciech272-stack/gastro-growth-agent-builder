import type { GrowthMission } from "./growthTypes";

export type ExecutionEventType = "action.execution.started" | "action.execution.retrying" | "action.execution.completed" | "action.execution.failed";

export type ExecutionEvent = {
  type: ExecutionEventType;
  businessId: string;
  missionId: string;
  actionId: string;
  occurredAt: string;
  attempt: number;
  metadata?: Record<string, unknown>;
};

export function createExecutionEvent(type: ExecutionEventType, mission: GrowthMission, actionId: string, attempt: number, metadata?: Record<string, unknown>): ExecutionEvent {
  return { type, businessId: mission.businessId, missionId: mission.id, actionId, occurredAt: new Date().toISOString(), attempt, metadata };
}
