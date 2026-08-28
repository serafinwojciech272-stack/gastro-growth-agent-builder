import type { GrowthDecisionContext, GrowthMission } from "./growthTypes";
import { buildGrowthDecision } from "./decisionEngine";
import { buildMission } from "./missionBuilder";
import type { MissionPersistence } from "./missionPersistence";
import { persistDraftMission } from "./growthWorkflow";

export type AutoMissionResult = {
  decision: ReturnType<typeof buildGrowthDecision>;
  mission: GrowthMission;
};

export async function autoCreateMission(
  context: GrowthDecisionContext,
  store: MissionPersistence,
): Promise<AutoMissionResult> {
  const decision = buildGrowthDecision(context);
  if (!decision.shouldAct || !decision.selectedOpportunity) {
    throw new Error("No actionable growth opportunity was selected");
  }

  const mission = buildMission(context, decision);
  await persistDraftMission(store, mission);
  return { decision, mission };
}
