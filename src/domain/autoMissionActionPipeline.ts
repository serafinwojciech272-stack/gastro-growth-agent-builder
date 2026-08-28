import type { GrowthDecisionContext } from "./growthTypes";
import type { MissionPersistence } from "./missionPersistence";
import { autoCreateMission } from "./autoMissionPipeline";
import { CapabilityRegistry } from "./capabilityRegistry";
import { autoGenerateActionPlan, type AutoActionPlan } from "./autoActionPipeline";

export type AutoMissionActionResult = {
  missionId: string;
  actionPlan: AutoActionPlan;
};

export async function autoBuildMissionToExecutionPlan(
  context: GrowthDecisionContext,
  store: MissionPersistence,
  registry: CapabilityRegistry,
): Promise<AutoMissionActionResult> {
  const { mission } = await autoCreateMission(context, store);
  const actionPlan = autoGenerateActionPlan(context, mission, registry);
  await store.saveActions(mission.id, actionPlan.actions);
  return { missionId: mission.id, actionPlan };
}
