import type { GrowthAction, GrowthDecisionContext, GrowthMission } from "./growthTypes";
import type { GrowthDecision, OpportunitySignal } from "./growthDecisionEngine";
import { createGrowthDecision } from "./growthDecisionEngine";
import { buildGrowthMission, prepareMissionForApproval } from "./missionBuilder";

type OrchestrationInput = {
  context: GrowthDecisionContext;
  opportunities: readonly OpportunitySignal[];
  actions: readonly GrowthAction[];
  missionId: string;
  deadline?: string;
  target?: string;
};

export type GrowthOrchestrationResult = {
  decision: GrowthDecision;
  mission: GrowthMission;
  requiresApproval: true;
  nextStep: "approval";
};

export function orchestrateGrowthMission(input: OrchestrationInput): GrowthOrchestrationResult | null {
  const decision = createGrowthDecision(input.context, input.opportunities, input.actions);
  if (!decision) return null;

  const draft = buildGrowthMission(input.context, decision, {
    missionId: input.missionId,
    deadline: input.deadline,
    target: input.target,
  });

  return {
    decision,
    mission: prepareMissionForApproval(draft),
    requiresApproval: true,
    nextStep: "approval",
  };
}
