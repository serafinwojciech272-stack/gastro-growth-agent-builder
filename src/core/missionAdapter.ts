/**
 * Adapter from Core MissionIntent to the existing Growth Advisor mission model.
 *
 * Important invariant: this adapter does not execute, persist, or create a second
 * mission state machine. Existing autoCreateMission / MissionPersistence remain
 * the sole application control-plane implementation.
 */
import type { GrowthAction, GrowthDecisionContext, GrowthMission } from "../domain/growthTypes";
import { autoCreateMission, type AutoMissionResult } from "../domain/autoMissionPipeline";
import type { MissionPersistence } from "../domain/missionPersistence";
import type { MissionIntent } from "./contracts";

export type CoreMissionAdapterInput = {
  context: GrowthDecisionContext;
  signals: Parameters<typeof autoCreateMission>[1];
  actions: readonly GrowthAction[];
  store: MissionPersistence;
};

export type CoreMissionAdapterResult = AutoMissionResult & {
  intent: MissionIntent;
};

export function missionIntentFromGrowthMission(mission: GrowthMission): MissionIntent {
  return {
    id: mission.id,
    businessId: mission.businessId,
    objective: mission.objective,
    actions: mission.actions.map((action) => action.title),
    kpis: mission.measurementKpis.map((kpi) => kpi.key),
    expectedOutcome: mission.expectedImpact ?? mission.objective,
    risk: mission.actions.some((action) => action.risk === "high")
      ? "high"
      : mission.actions.some((action) => action.risk === "medium")
        ? "medium"
        : "low",
    requiresApproval: mission.status === "awaiting_approval" || mission.status === "draft",
    createdAt: new Date().toISOString(),
  };
}

export async function createMissionThroughExistingControlPlane(
  input: CoreMissionAdapterInput,
): Promise<CoreMissionAdapterResult> {
  const result = await autoCreateMission(input.context, input.signals, input.actions, input.store);
  return { ...result, intent: missionIntentFromGrowthMission(result.mission) };
}
