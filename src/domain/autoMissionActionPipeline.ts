import type { GrowthAction, GrowthDecisionContext } from "./growthTypes";
import type { MissionPersistence } from "./missionPersistence";
import type { OpportunitySignal } from "./growthDecisionEngine";
import { autoCreateMission } from "./autoMissionPipeline";
import { CapabilityRegistry } from "./capabilityRegistry";
import { autoGenerateActionPlan, type AutoActionPlan } from "./autoActionPipeline";

export type AutoMissionActionResult = {
  missionId: string;
  actionPlan: AutoActionPlan;
};

export async function autoBuildMissionToExecutionPlan(
  context: GrowthDecisionContext,
  signals: readonly OpportunitySignal[],
  actions: readonly GrowthAction[],
  store: MissionPersistence,
  registry: CapabilityRegistry,
): Promise<AutoMissionActionResult> {
  const { mission } = await autoCreateMission(context, signals, actions, store);
  const actionPlan = autoGenerateActionPlan(context, mission, registry);
  await store.saveActions(mission.id, actionPlan.actions);
  return { missionId: mission.id, actionPlan };
}
