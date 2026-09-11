import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateGrowthHealth } from "./growthHealth";

test("growth health is unknown without evidence", () => {
  const result = calculateGrowthHealth({ activeMissions: 0, pendingApprovals: 0, openActions: 0, measuredOutcomes: 0, positiveOutcomes: 0, learningSignals: 0 });
  assert.equal(result.score, null);
  assert.equal(result.status, "unknown");
});

test("growth health is strong only with substantial measured evidence", () => {
  const result = calculateGrowthHealth({ activeMissions: 2, pendingApprovals: 0, openActions: 3, measuredOutcomes: 5, positiveOutcomes: 5, learningSignals: 3 });
  assert.equal(result.score !== null, true);
  assert.equal(result.status, "strong");
  assert.ok(result.confidence > 0);
  assert.ok(result.evidence.length >= 3);
});

test("approval backlog reduces governance health", () => {
  const clear = calculateGrowthHealth({ activeMissions: 1, pendingApprovals: 0, openActions: 1, measuredOutcomes: 1, positiveOutcomes: 1, learningSignals: 1 });
  const blocked = calculateGrowthHealth({ activeMissions: 1, pendingApprovals: 3, openActions: 1, measuredOutcomes: 1, positiveOutcomes: 1, learningSignals: 1 });
  assert.ok((clear.score ?? 0) > (blocked.score ?? 0));
});
