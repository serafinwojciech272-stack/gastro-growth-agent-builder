import type { GrowthAction, GrowthDecisionContext, GrowthMission } from "./growthTypes";
import { createGrowthDecision, type GrowthDecision, type OpportunitySignal } from "./growthDecisionEngine";
import { buildGrowthMission } from "./missionBuilder";
import type { MissionPersistence } from "./missionPersistence";
import { persistDraftMission } from "./growthWorkflow";

export type AutoMissionResult = {
  decision: GrowthDecision;
  mission: GrowthMission;
};

export async function autoCreateMission(
  context: GrowthDecisionContext,
  signals: readonly OpportunitySignal[],
  actions: readonly GrowthAction[],
  store: MissionPersistence,
): Promise<AutoMissionResult> {
  const decision = createGrowthDecision(context, signals, actions);
  if (!decision) throw new Error("No actionable growth opportunity was selected");

  const mission = buildGrowthMission(context, decision, {
    missionId: crypto.randomUUID(),
    status: "draft",
  });
  await persistDraftMission(store, mission);
  return { decision, mission };
}
