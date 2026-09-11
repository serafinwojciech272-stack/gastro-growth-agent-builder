import { test } from "node:test";
import assert from "node:assert/strict";
import { selectModel, type ModelCandidate } from "./modelOrchestrator";

const models: ModelCandidate[] = [
  { id: "fast", provider: "provider-a", capabilities: ["fast", "structured_output"], costTier: "low", qualityTier: "standard", enabled: true },
  { id: "reasoner", provider: "provider-b", capabilities: ["reasoning", "structured_output"], costTier: "medium", qualityTier: "strong", enabled: true },
  { id: "frontier", provider: "provider-c", capabilities: ["reasoning", "structured_output", "vision"], costTier: "high", qualityTier: "frontier", enabled: true },
];

test("model orchestrator prefers capable reasoning model under policy", () => {
  const result = selectModel("diagnosis", models, { preferred: ["reasoner", "fast"], fallback: ["frontier"], maxCostTier: "medium", requireStructuredOutput: true, evaluationRequired: true });
  assert.equal(result.selected.id, "reasoner");
  assert.ok(result.fallbackChain.some((model) => model.id === "fast"));
});

test("model orchestrator rejects disabled or over-budget-only candidates", () => {
  assert.throws(() => selectModel("mission_planning", [{ ...models[2], enabled: true }], { preferred: [], fallback: [], maxCostTier: "medium", requireStructuredOutput: true, evaluationRequired: true }));
});
