import { describe, expect, it } from "vitest";
import { buildMarketingBrief, buildMarketingPlan } from "./marketingEngine";

describe("marketing engine", () => {
  it("builds a validated marketing brief", () => {
    const brief = buildMarketingBrief({
      businessId: "biz-1",
      objective: "reservations",
      audience: "local guests",
      offer: "weekday dinner",
      channels: ["facebook", "instagram"],
      message: "Book your weekday dinner",
      callToAction: "Reserve a table",
      kpis: [{ key: "reservations", label: "Reservations", unit: "count", target: 20 }],
    });
    expect(brief.id).toBeTruthy();
    expect(brief.channels).toHaveLength(2);
  });

  it("rejects an empty channel set", () => {
    expect(() => buildMarketingBrief({
      businessId: "biz-1",
      objective: "awareness",
      audience: "local guests",
      offer: "new menu",
      channels: [],
      message: "Try our new menu",
      callToAction: "Visit us",
      kpis: [{ key: "reach", label: "Reach", unit: "count" }],
    })).toThrow("at least one channel");
  });

  it("keeps marketing execution approval-gated", () => {
    const brief = buildMarketingBrief({
      businessId: "biz-1",
      objective: "traffic",
      audience: "local guests",
      offer: "new menu",
      channels: ["website"],
      message: "See the new menu",
      callToAction: "View menu",
      kpis: [{ key: "traffic", label: "Traffic", unit: "count" }],
    });
    const plan = buildMarketingPlan(brief, {
      id: "mission-1", businessId: "biz-1", vertical: "restaurant", objective: "increase traffic",
      actions: [], measurementKpis: [], status: "approved",
    });
    expect(plan.actions[0]?.requiresApproval).toBe(true);
    expect(plan.actions[0]?.autonomyLevel).toBe(2);
  });
});
