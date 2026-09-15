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
    decisionId: mission.decisionId,
    objective: mission.objective,
    actions: mission.actions.map((action) => action.title),
    kpis: mission.kpis,
    expectedOutcome: mission.expectedOutcome,
    risk: mission.risk,
    requiresApproval: mission.status === "awaiting_approval" || mission.status === "draft",
    sourceOpportunityId: mission.opportunityId,
    createdAt: mission.createdAt,
  };
}

export async function createMissionThroughExistingControlPlane(
  input: CoreMissionAdapterInput,
): Promise<CoreMissionAdapterResult> {
  const result = await autoCreateMission(input.context, input.signals, input.actions, input.store);
  return { ...result, intent: missionIntentFromGrowthMission(result.mission) };
}
