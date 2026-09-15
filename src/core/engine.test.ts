import test from "node:test";
import assert from "node:assert/strict";
import { runCoreEngine } from "./engine";
import { missionIntentFromGrowthMission } from "./missionAdapter";
import { recordCoreOutcome, toCoreLearning } from "./outcome";
import { scoreOpportunity, type BusinessContext, type Opportunity, DEFAULT_PRIORITY_POLICY } from "./contracts";
import type { GrowthMission } from "../domain/growthTypes";

test("Core Engine produces an evidence-backed reasoning trace", () => {
  const context: BusinessContext = {
    business: {
      id: "business-1",
      organizationId: "org-1",
      name: "Demo Business",
      industry: "restaurant",
      businessModel: "b2c",
      locations: [],
      products: [],
      services: [],
      customerSegments: [],
      competitors: [],
      goals: [],
      constraints: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    entities: [],
    relationships: [],
    activeGoals: [],
    activeConstraints: [],
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
  };

  const result = runCoreEngine({
    context,
    signals: [
      {
        id: "signal-1",
        businessId: "business-1",
        type: "metric_change",
        source: "test",
        metric: "conversion_rate",
        value: 8,
        baseline: 10,
        deviation: -20,
        direction: "negative",
        confidence: 0.9,
        context: {},
        observedAt: "2026-01-02T00:00:00.000Z",
      },
    ],
  });

  assert.equal(result.run.status, "completed");
  assert.equal(result.evidence.length, 1);
  assert.equal(result.diagnoses.length, 1);
  assert.equal(result.opportunities.length, 1);
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.priorities.length, 1);
  assert.deepEqual(
    result.run.trace.map((event) => event.stage),
    ["context", "signal", "evidence", "diagnosis", "opportunity", "recommendation", "priority"],
  );
});

test("Core priority scoring is deterministic and records its policy version", () => {
  const opportunity: Opportunity = {
    id: "opportunity-1",
    businessId: "business-1",
    title: "Improve conversion",
    description: "Test",
    impact: 80,
    urgency: 70,
    confidence: 0.9,
    effort: 20,
    cost: 10,
    risk: 10,
    roi: 75,
    strategicValue: 60,
    timeToResultDays: 14,
    dependencies: [],
    relatedKpis: ["conversion_rate"],
  };

  const first = scoreOpportunity(opportunity, DEFAULT_PRIORITY_POLICY);
  const second = scoreOpportunity(opportunity, DEFAULT_PRIORITY_POLICY);

  assert.equal(first.score, second.score);
  assert.equal(first.policyVersion, DEFAULT_PRIORITY_POLICY.version);
  assert.equal(first.factors.impact, 80);
});

test("Mission adapter maps into Core intent without introducing a second state machine", () => {
  const mission: GrowthMission = {
    id: "mission-1",
    businessId: "business-1",
    vertical: "restaurant",
    objective: "Improve conversion",
    expectedImpact: "Increase qualified conversions",
    actions: [
      { id: "action-1", title: "Prepare remediation", description: "Test", risk: "medium", autonomyLevel: 1, requiresApproval: true },
      { id: "action-2", title: "Measure outcome", description: "Test", risk: "low", autonomyLevel: 0, requiresApproval: true },
    ],
    measurementKpis: [{ key: "conversion_rate", label: "Conversion rate", unit: "percentage" }],
    status: "awaiting_approval",
  };

  const intent = missionIntentFromGrowthMission(mission);

  assert.equal(intent.id, mission.id);
  assert.equal(intent.businessId, mission.businessId);
  assert.deepEqual(intent.actions, ["Prepare remediation", "Measure outcome"]);
  assert.deepEqual(intent.kpis, ["conversion_rate"]);
  assert.equal(intent.risk, "medium");
  assert.equal(intent.requiresApproval, true);
});

test("Core outcome adapter preserves insufficient-data semantics and derives reusable learning", () => {
  const mission: GrowthMission = {
    id: "mission-2",
    businessId: "business-1",
    vertical: "generic_business",
    objective: "Test outcome",
    actions: [],
    measurementKpis: [{ key: "revenue", label: "Revenue", unit: "currency" }],
    status: "measuring",
  };

  const outcome = recordCoreOutcome({
    mission,
    confidence: 0.9,
    metrics: { revenue: { before: 100, after: 120, delta: 20 } },
    evidence: ["evidence-1"],
  });
  const learning = toCoreLearning({
    ...outcome,
    learning: undefined,
  });

  assert.equal(outcome.status, "success");
  assert.equal(outcome.evidenceIds[0], "evidence-1");
  assert.equal(learning.sourceOutcomeId, "mission-2");
  assert.equal(learning.reusable, true);
});
