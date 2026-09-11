import { test } from "node:test";
import assert from "node:assert/strict";
import { canFallback, selectModel, type ModelCandidate, type ModelPolicy } from "./modelOrchestrator";

const models: ModelCandidate[] = [
  { id: "fast", provider: "provider-a", capabilities: ["fast", "structured_output"], costTier: "low", qualityTier: "standard", enabled: true },
  { id: "reasoner", provider: "provider-b", capabilities: ["reasoning", "structured_output"], costTier: "medium", qualityTier: "strong", enabled: true },
  { id: "frontier", provider: "provider-c", capabilities: ["reasoning", "structured_output", "vision"], costTier: "high", qualityTier: "frontier", enabled: true },
];

const policy: ModelPolicy = { preferred: ["reasoner"], fallback: ["frontier", "fast"], maxCostTier: "high", requireStructuredOutput: true, evaluationRequired: true };

test("model orchestrator prefers the capable reasoning model", () => {
  const result = selectModel("diagnosis", models, policy);
  assert.equal(result.selected.id, "reasoner");
  assert.deepEqual(result.fallbackChain.map((model) => model.id), ["frontier"]);
});

test("incapable models never enter the fallback chain", () => {
  const result = selectModel("diagnosis", models, policy);
  assert.equal(result.fallbackChain.some((model) => model.id === "fast"), false);
});

test("maximum cost tier is enforced", () => {
  const result = selectModel("diagnosis", models, { ...policy, maxCostTier: "medium" });
  assert.equal(result.selected.id, "reasoner");
  assert.equal(result.fallbackChain.length, 0);
});

test("fallback availability is explicit", () => {
  const result = selectModel("diagnosis", models, policy);
  assert.equal(canFallback(result, "reasoner"), true);
  assert.equal(canFallback(result, "frontier"), false);
});

test("throws when no model satisfies the task policy", () => {
  assert.throws(() => selectModel("mission_planning", [{ ...models[2], enabled: true }], { ...policy, maxCostTier: "medium" }));
});
