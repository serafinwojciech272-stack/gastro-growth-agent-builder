import type { GrowthAction } from "./growthTypes";
import type { OpportunitySignal } from "./growthDecisionEngine";

export type ActionTemplate = Omit<GrowthAction, "id"> & { idPrefix?: string };

export function buildGrowthActions(
  opportunity: OpportunitySignal,
  templates: readonly ActionTemplate[],
): GrowthAction[] {
  const kpis = new Set(opportunity.relatedKpis.map((kpi) => kpi.toLowerCase()));
  return templates
    .filter((template) => {
      const haystack = `${template.title} ${template.description}`.toLowerCase();
      return opportunity.relatedKpis.length === 0 || [...kpis].some((kpi) => haystack.includes(kpi));
    })
    .slice(0, 5)
    .map((template, index) => ({
      ...template,
      id: `${template.idPrefix ?? "action"}-${opportunity.id}-${index + 1}`,
    }));
}

export function ensureActionCoverage(
  actions: readonly GrowthAction[],
  fallback: readonly GrowthAction[],
): GrowthAction[] {
  if (actions.length >= 3) return [...actions];
  return [...actions, ...fallback].slice(0, 5);
}
