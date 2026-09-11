import test from "node:test";
import assert from "node:assert/strict";
import { buildBusinessIntelligence } from "./businessIntelligencePipeline.ts";
import { runIntelligenceControlPlane } from "./intelligenceControlPlane.ts";
import { measureGrowthOutcome } from "./outcomeLearningEngine.ts";
import type { BusinessContext, BusinessSignal } from "./universalBusinessCore.ts";
import type { GrowthAction, GrowthDecisionContext, GrowthKpi } from "./growthTypes.ts";

const context: BusinessContext = {
  business: {
    id: "biz-1", organizationId: "org-1", name: "Test Business", industry: "restaurant", businessModel: "b2c",
    locations: [], products: [], services: [], customerSegments: [], competitors: [], goals: [], constraints: [], createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
  }, entities: [], relationships: [], activeGoals: [], activeConstraints: [], lastUpdatedAt: "2026-01-01T00:00:00Z",
};
const signal: BusinessSignal = {
  id: "signal-1", businessId: "biz-1", type: "metric_change", source: "website", metric: "conversion", value: 2.1,
  baseline: 3, deviation: -30, direction: "negative", confidence: 0.9, context: {}, observedAt: "2026-01-02T00:00:00Z",
};
const decisionContext: GrowthDecisionContext = { vertical: "restaurant", businessId: "biz-1", objective: "Improve conversion", kpis: [] };
const actions: GrowthAction[] = [{ id: "action-1", title: "Improve conversion", description: "Remediate", risk: "medium", autonomyLevel: 1, requiresApproval: true }];
const kpis: GrowthKpi[] = [{ key: "conversion", label: "Conversion", unit: "percentage" }];

test("intelligence pipeline preserves business trace", () => {
  const result = buildBusinessIntelligence({ context, signals: [signal] });
  assert.equal(result.traceErrors.length, 0);
  assert.equal(result.evidence.length, 1);
  assert.equal(result.diagnoses.length, 1);
  assert.equal(result.opportunities.length, 1);
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.priorities.length, 1);
});

test("cross-business signals are ignored by the scoped pipeline", () => {
  const foreign = { ...signal, id: "signal-foreign", businessId: "biz-2" };
  const result = buildBusinessIntelligence({ context, signals: [signal, foreign] });
  assert.equal(result.evidence.length, 1);
  assert.equal(result.traceErrors.length, 0);
});

test("control plane produces approval-gated mission plan", () => {
  const result = runIntelligenceControlPlane({ context, signals: [signal], decisionContext, actions, measurementKpis: kpis });
  assert.equal(result.traceErrors.length, 0);
  assert.ok(result.missionPlan);
  assert.equal(result.missionPlan?.mission.status, "awaiting_approval");
});

test("measurement derives learning from outcome", () => {
  const result = measureGrowthOutcome({ missionId: "mission-1", measuredAt: "2026-01-03T00:00:00Z", confidence: 0.9, metrics: { conversion: { baseline: 3, before: 2.1, after: 3.4 } } });
  assert.equal(result.outcome.status, "success");
  assert.ok(Math.abs((result.outcome.metrics.conversion.delta ?? Number.NaN) - 1.3) < Number.EPSILON * 8);
  assert.equal(result.learning.reusable, true);
});

test("insufficient measurement does not create reusable learning", () => {
  const result = measureGrowthOutcome({ missionId: "mission-2", measuredAt: "2026-01-03T00:00:00Z", confidence: 0.4, metrics: { conversion: { baseline: 3 } } });
  assert.equal(result.outcome.status, "insufficient_data");
  assert.equal(result.learning.reusable, false);
});
