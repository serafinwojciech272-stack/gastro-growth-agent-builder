import { describe, expect, it } from "vitest";
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
    expect(result.status).toBe("allowed");
    expect(result.allowedTool).toBe(true);
  });

  it("requires approval before an external side effect", () => {
    const result = evaluateToolAction({ actionId: "a-2", toolId: "send-email" }, registry);
    expect(result.status).toBe("requires_approval");
    expect(result.requiresApproval).toBe(true);
  });

  it("blocks an unregistered tool", () => {
    const result = evaluateToolAction({ actionId: "a-3", toolId: "unknown" }, registry);
    expect(result.status).toBe("blocked");
    expect(result.allowedTool).toBe(false);
  });
});
