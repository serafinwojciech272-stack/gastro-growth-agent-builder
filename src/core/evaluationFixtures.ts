import type { GrowthOutcome } from "../domain/growthTypes";

export type OutcomeEvaluationFixture = {
  name: string;
  outcome: GrowthOutcome;
  expected: {
    reusable: boolean;
    insightIncludes: string;
  };
};

export const OUTCOME_EVALUATION_FIXTURES: readonly OutcomeEvaluationFixture[] = [
  {
    name: "high-confidence-positive",
    outcome: {
      missionId: "fixture-positive",
      status: "success",
      measuredAt: "2026-01-02T12:00:00.000Z",
      metrics: { orders: { before: 100, after: 125, delta: 25 } },
      evidence: ["orders-report"],
      confidence: 0.9,
    },
    expected: { reusable: true, insightIncludes: "positive" },
  },
  {
    name: "insufficient-data",
    outcome: {
      missionId: "fixture-insufficient",
      status: "insufficient_data",
      measuredAt: "2026-01-02T12:00:00.000Z",
      metrics: {},
      evidence: [],
      confidence: 0.3,
    },
    expected: { reusable: false, insightIncludes: "insufficient" },
  },
  {
    name: "negative-outcome",
    outcome: {
      missionId: "fixture-negative",
      status: "negative",
      measuredAt: "2026-01-02T12:00:00.000Z",
      metrics: { cancellations: { before: 10, after: 15, delta: -5 } },
      evidence: ["cancellations-report"],
      confidence: 0.9,
    },
    expected: { reusable: false, insightIncludes: "negative" },
  },
  {
    name: "mixed-outcome",
    outcome: {
      missionId: "fixture-mixed",
      status: "partial_success",
      measuredAt: "2026-01-02T12:00:00.000Z",
      metrics: {
        orders: { before: 100, after: 110, delta: 10 },
        cancellations: { before: 10, after: 12, delta: -2 },
      },
      evidence: ["orders-report", "cancellations-report"],
      confidence: 0.8,
    },
    expected: { reusable: true, insightIncludes: "mixed" },
  },
];
