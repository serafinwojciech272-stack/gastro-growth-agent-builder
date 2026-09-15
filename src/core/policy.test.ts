import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_AUTONOMY_POLICY,
  evaluatePolicy,
  validateAutonomyPolicy,
} from "./policy";

test("default autonomy policy is valid and versioned", () => {
  assert.deepEqual(validateAutonomyPolicy(DEFAULT_AUTONOMY_POLICY), []);
  assert.equal(DEFAULT_AUTONOMY_POLICY.version.id, "autonomy-v1");
});

test("controlled low-risk reversible action is allowed", () => {
  const decision = evaluatePolicy({ actionId: "a1", risk: "low" });
  assert.equal(decision.status, "allowed");
  assert.equal(decision.requiresApproval, false);
  assert.equal(decision.policyVersion, "autonomy-v1");
});

test("irreversible action requires approval", () => {
  const decision = evaluatePolicy({
    actionId: "a2",
    risk: "low",
    irreversible: true,
  });
  assert.equal(decision.status, "requires_approval");
  assert.equal(decision.requiresApproval, true);
});

test("critical-risk action is blocked", () => {
  const decision = evaluatePolicy({ actionId: "a3", risk: "critical" });
  assert.equal(decision.status, "blocked");
  assert.match(decision.reason, /Critical-risk/);
});

test("blocked tool cannot execute even when risk is low", () => {
  const policy = {
    ...DEFAULT_AUTONOMY_POLICY,
    blockedToolIds: ["dangerous-tool"],
  };
  const decision = evaluatePolicy({
    actionId: "a4",
    toolId: "dangerous-tool",
    risk: "low",
  }, policy);
  assert.equal(decision.status, "blocked");
  assert.equal(decision.allowedTool, false);
});

test("advisory autonomy never permits unattended execution", () => {
  const decision = evaluatePolicy({
    actionId: "a5",
    risk: "low",
    requestedAutonomy: "advisory",
  });
  assert.equal(decision.status, "requires_approval");
});

test("external side effects require approval", () => {
  const decision = evaluatePolicy({
    actionId: "a6",
    risk: "medium",
    externalSideEffect: true,
  });
  assert.equal(decision.status, "requires_approval");
});
