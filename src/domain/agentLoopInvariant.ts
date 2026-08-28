import type { GrowthMission } from "./growthTypes";

export function assertAgentLoopInvariant(mission: GrowthMission): void {
  if (!mission.id || !mission.businessId) throw new Error("Mission identity is required");
  if (!mission.objective.trim()) throw new Error("Mission objective is required");
  if (mission.actions.length === 0) throw new Error("Mission must contain at least one action");
  if (mission.measurementKpis.length === 0) throw new Error("Mission must contain at least one measurement KPI");
  if (mission.confidence !== undefined && (mission.confidence < 0 || mission.confidence > 1)) throw new Error("Mission confidence must be between 0 and 1");
  const ids = new Set<string>();
  for (const action of mission.actions) {
    if (ids.has(action.id)) throw new Error(`Duplicate action id: ${action.id}`);
    ids.add(action.id);
    if (action.risk === "high" && !action.requiresApproval) throw new Error(`High risk action ${action.id} must require approval`);
  }
}
