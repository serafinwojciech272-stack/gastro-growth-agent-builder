import type { AutonomyLevel, GrowthAction } from "./growthTypes";

export type AgentRunPolicy = {
  maxAutonomyLevel: AutonomyLevel;
  requireApprovalAbove: AutonomyLevel;
  maxActionsPerMission: number;
};

export const DEFAULT_AGENT_RUN_POLICY: AgentRunPolicy = {
  maxAutonomyLevel: 3,
  requireApprovalAbove: 3,
  maxActionsPerMission: 10,
};

export function validateAgentRun(actions: readonly GrowthAction[], policy: AgentRunPolicy = DEFAULT_AGENT_RUN_POLICY): void {
  if (actions.length > policy.maxActionsPerMission) throw new Error(`Mission exceeds action limit: ${actions.length}/${policy.maxActionsPerMission}`);
  for (const action of actions) {
    if (action.autonomyLevel > policy.maxAutonomyLevel) throw new Error(`Action ${action.id} exceeds agent autonomy limit`);
    if (action.autonomyLevel >= policy.requireApprovalAbove && !action.requiresApproval) {
      throw new Error(`Action ${action.id} requires approval at autonomy level ${action.autonomyLevel}`);
    }
  }
}
