import type { GrowthAction, GrowthDecisionContext, GrowthMission } from "./growthTypes";
import { buildExecutionPlan, type ExecutionPlan } from "./executionPlan";
import { CapabilityRegistry } from "./capabilityRegistry";

export type ActionQuality = { score: number; approved: boolean; reasons: string[] };

export function qualityCheckAction(action: GrowthAction): ActionQuality {
  const reasons: string[] = [];
  let score = 100;
  if (!action.title.trim()) { score -= 30; reasons.push("Missing title"); }
  if (!action.description.trim()) { score -= 25; reasons.push("Missing description"); }
  if (!action.rollbackStrategy?.trim()) { score -= 15; reasons.push("Missing rollback strategy"); }
  if (action.risk === "high") { score -= 10; reasons.push("High-risk action requires human review"); }
  if (action.autonomyLevel < 3) { score -= 10; reasons.push("Below autonomous execution threshold"); }
  return { score: Math.max(0, score), approved: score >= 70, reasons };
}

export function prioritizeActions(actions: readonly GrowthAction[]): GrowthAction[] {
  const riskWeight = { low: 3, medium: 2, high: 1 } as const;
  return [...actions].sort((a, b) => {
    const aScore = a.autonomyLevel * 10 + riskWeight[a.risk];
    const bScore = b.autonomyLevel * 10 + riskWeight[b.risk];
    return bScore - aScore;
  });
}

export type AutoActionPlan = {
  missionId: string;
  actions: GrowthAction[];
  quality: Array<ActionQuality & { actionId: string }>;
  executionPlan: ExecutionPlan;
};

export function autoGenerateActionPlan(
  _context: GrowthDecisionContext,
  mission: GrowthMission,
  _registry: CapabilityRegistry,
): AutoActionPlan {
  const actions = prioritizeActions(mission.actions);
  const quality = actions.map((action) => ({ actionId: action.id, ...qualityCheckAction(action) }));
  const approvedActions = actions.filter((action) => quality.find((item) => item.actionId === action.id)?.approved);
  const executionPlan = buildExecutionPlan({ ...mission, actions: approvedActions });
  return { missionId: mission.id, actions: approvedActions, quality, executionPlan };
}
