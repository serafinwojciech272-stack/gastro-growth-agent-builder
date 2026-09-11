import { test } from "node:test";
import assert from "node:assert/strict";
import { canExecuteWithinPolicy, validateActionPolicy } from "./growthTypes";

test("autonomy policy rejects risky autonomous execution", () => {
  const errors = validateActionPolicy({ risk: "high", autonomyLevel: 3, requiresApproval: false });
  assert.ok(errors.length > 0);
  assert.equal(canExecuteWithinPolicy({ risk: "high", autonomyLevel: 3, requiresApproval: false }, { executionsToday: 0 }), false);
});

test("autonomy policy enforces frequency, budget and integration limits", () => {
  const policy = { risk: "low" as const, autonomyLevel: 3 as const, requiresApproval: false, maxFrequencyPerDay: 2, maxBudget: 100, allowedIntegrations: ["internal"] };
  assert.equal(canExecuteWithinPolicy(policy, { executionsToday: 1, spendToday: 40, integration: "internal" }), true);
  assert.equal(canExecuteWithinPolicy(policy, { executionsToday: 2, spendToday: 40, integration: "internal" }), false);
  assert.equal(canExecuteWithinPolicy(policy, { executionsToday: 1, spendToday: 101, integration: "internal" }), false);
  assert.equal(canExecuteWithinPolicy(policy, { executionsToday: 1, spendToday: 40, integration: "external" }), false);
});
