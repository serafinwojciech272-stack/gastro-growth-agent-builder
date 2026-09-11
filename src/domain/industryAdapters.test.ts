import { test } from "node:test";
import assert from "node:assert/strict";
import { getIndustryAdapter, listIndustryAdapters } from "./industryAdapters";

test("industry adapters cover the universal vertical set", () => {
  const adapters = listIndustryAdapters();
  assert.ok(adapters.length >= 18);
  assert.equal(getIndustryAdapter("restaurant").id, "restaurant");
  assert.equal(getIndustryAdapter("saas").id, "saas");
  assert.equal(getIndustryAdapter("unknown").id, "generic_business");
});

test("adapter metrics preserve north-star and guardrail roles", () => {
  for (const adapter of listIndustryAdapters()) {
    assert.ok(adapter.metrics.some((metric) => metric.diagnosticRole === "north_star"));
    assert.ok(adapter.metrics.some((metric) => metric.diagnosticRole === "guardrail"));
    assert.ok(adapter.growthLevers.length > 0);
  }
});
