import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { GrowthMission } from "../domain/growthTypes";
import { toCoreLearning, toCoreOutcome, recordCoreOutcome } from "./outcome";
import { OUTCOME_EVALUATION_FIXTURES } from "./evaluationFixtures";

const mission: GrowthMission = {
  id: "mission-compat-1",
  businessId: "business-1",
  vertical: "restaurant",
  objective: "Increase weekday lunch demand",
  actions: [],
  measurementKpis: [],
  status: "completed",
};

describe("Core outcome compatibility", () => {
  it("maps a canonical Growth Outcome into the Core contract without changing measurements", () => {
    const outcome = recordCoreOutcome({
      mission,
      measuredAt: "2026-01-02T12:00:00.000Z",
      confidence: 0.9,
      metrics: {
        lunchOrders: { before: 100, after: 125, delta: 25, target: 120 },
      },
      evidence: ["evidence-lunch-orders"],
    });

    assert.equal(outcome.missionId, mission.id);
    assert.equal(outcome.status, "success");
    assert.equal(outcome.measuredAt, "2026-01-02T12:00:00.000Z");
    assert.deepEqual(outcome.metrics.lunchOrders, { before: 100, after: 125, delta: 25, target: 120 });
    assert.deepEqual(outcome.evidenceIds, ["evidence-lunch-orders"]);
    assert.equal(outcome.confidence, 0.9);
  });

  it("derives reusable learning from a measured successful outcome", () => {
    const outcome = toCoreOutcome({
      missionId: mission.id,
      status: "success",
      measuredAt: "2026-01-02T12:00:00.000Z",
      metrics: { lunchOrders: { before: 100, after: 125, delta: 25 } },
      evidence: ["evidence-lunch-orders"],
      confidence: 0.9,
    });

    const learning = toCoreLearning({
      missionId: outcome.missionId,
      status: outcome.status,
      measuredAt: outcome.measuredAt,
      metrics: outcome.metrics,
      evidence: outcome.evidenceIds,
      confidence: outcome.confidence,
    });

    assert.equal(learning.sourceOutcomeId, mission.id);
    assert.equal(learning.reusable, true);
    assert.equal(learning.confidence, 0.9);
    assert.match(learning.insight, /positive/);
    assert.match(learning.nextRecommendation ?? "", /Preserve/);
  });

  it("preserves insufficient-data semantics instead of manufacturing learning", () => {
    const learning = toCoreLearning({
      missionId: mission.id,
      status: "insufficient_data",
      measuredAt: "2026-01-02T12:00:00.000Z",
      metrics: {},
      evidence: [],
      confidence: 0.3,
    });

    assert.equal(learning.sourceOutcomeId, mission.id);
    assert.equal(learning.reusable, false);
    assert.equal(learning.confidence, 0.3);
    assert.match(learning.insight, /insufficient/);
  });

  it("keeps fixture expectations deterministic across positive, insufficient, negative and mixed outcomes", () => {
    for (const fixture of OUTCOME_EVALUATION_FIXTURES) {
      const learning = toCoreLearning(fixture.outcome);
      assert.equal(learning.reusable, fixture.expected.reusable, fixture.name);
      assert.match(learning.insight, new RegExp(fixture.expected.insightIncludes), fixture.name);
    }
  });
});
