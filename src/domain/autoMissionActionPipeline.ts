import type { GrowthAction, GrowthDecisionContext } from "./growthTypes";
import type { MissionPersistence } from "./missionPersistence";
import type { OpportunitySignal } from "./growthDecisionEngine";
import { autoCreateMission } from "./autoMissionPipeline";
import { CapabilityRegistry } from "./capabilityRegistry";
import { autoGenerateActionPlan, type AutoActionPlan } from "./autoActionPipeline";

export type AutoMissionActionResult = { missionId: string; actionPlan: AutoActionPlan };

export async function autoBuildMissionToExecutionPlan(context: GrowthDecisionContext, signals: readonly OpportunitySignal[], actions: readonly GrowthAction[], store: MissionPersistence, _registry: CapabilityRegistry): Promise<AutoMissionActionResult> {
  void _registry;
  const { mission } = await autoCreateMission(context, signals, actions, store);
  const actionPlan = autoGenerateActionPlan(context, mission);
  await store.saveActions(mission.id, actionPlan.actions);
  return { missionId: mission.id, actionPlan };
}
