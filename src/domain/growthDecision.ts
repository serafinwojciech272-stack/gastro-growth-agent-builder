export type Opportunity = {
  id: string;
  title: string;
  rationale: string;
  impact: number;
  confidence: number;
  effort: number;
  kpi: string;
};

export type DecisionResult = Opportunity & {
  priorityScore: number;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function scoreOpportunity(opportunity: Opportunity): number {
  return Number(
    (
      clamp(opportunity.impact) * 0.45 +
      clamp(opportunity.confidence) * 0.35 -
      clamp(opportunity.effort) * 0.2
    ).toFixed(2),
  );
}

export function rankOpportunities(opportunities: Opportunity[]): DecisionResult[] {
  return [...opportunities]
    .map((opportunity) => ({ ...opportunity, priorityScore: scoreOpportunity(opportunity) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

export function selectTopOpportunity(opportunities: Opportunity[]): DecisionResult | null {
  return rankOpportunities(opportunities)[0] ?? null;
}
