import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateToolAction, type ToolPermissionRegistry } from "./toolPolicy";

const registry: ToolPermissionRegistry = {
  get(toolId) {
    if (toolId === "draft-email") {
      return { toolId, risk: "low", reversible: true, externalSideEffect: false };
    }
    if (toolId === "send-email") {
      return { toolId, risk: "medium", reversible: false, externalSideEffect: true };
    }
    return undefined;
  },
};

describe("Core tool permission boundary", () => {
  it("allows a registered low-risk reversible tool under controlled autonomy", () => {
    const result = evaluateToolAction({ actionId: "a-1", toolId: "draft-email" }, registry);
    assert.equal(result.status, "allowed");
    assert.equal(result.allowedTool, true);
  });

  it("requires approval before an external side effect", () => {
    const result = evaluateToolAction({ actionId: "a-2", toolId: "send-email" }, registry);
    assert.equal(result.status, "requires_approval");
    assert.equal(result.requiresApproval, true);
  });

  it("blocks an unregistered tool", () => {
    const result = evaluateToolAction({ actionId: "a-3", toolId: "unknown" }, registry);
    assert.equal(result.status, "blocked");
    assert.equal(result.allowedTool, false);
  });
});
