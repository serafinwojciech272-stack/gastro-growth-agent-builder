import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMarketingBrief, buildMarketingPlan } from "./marketingEngine";

test("marketing engine builds a validated marketing brief", () => {
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
  assert.ok(brief.id);
  assert.equal(brief.channels.length, 2);
});

test("marketing engine rejects an empty channel set", () => {
  assert.throws(
    () => buildMarketingBrief({
      businessId: "biz-1",
      objective: "awareness",
      audience: "local guests",
      offer: "new menu",
      channels: [],
      message: "Try our new menu",
      callToAction: "Visit us",
      kpis: [{ key: "reach", label: "Reach", unit: "count" }],
    }),
    /at least one channel/,
  );
});

test("marketing execution remains approval-gated", () => {
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
    id: "mission-1",
    businessId: "biz-1",
    vertical: "restaurant",
    objective: "increase traffic",
    actions: [],
    measurementKpis: [],
    status: "approved",
  });
  assert.equal(plan.actions[0]?.requiresApproval, true);
  assert.equal(plan.actions[0]?.autonomyLevel, 2);
});
