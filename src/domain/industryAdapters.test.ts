import { test } from "node:test";
import assert from "node:assert/strict";
import { getIndustryAdapter, listIndustryAdapters } from "./industryAdapters";

test("industry adapters cover the universal vertical set", () => {
  const adapters = listIndustryAdapters();
  const ids = new Set(adapters.map((adapter) => adapter.id));
  const expected = [
    "restaurant", "beauty", "barber", "hairdresser", "fitness", "hotel", "home_services", "construction",
    "property_management", "dental", "ecommerce", "saas", "professional_services", "local_services", "retail",
    "health_wellness", "generic_business",
  ];
  assert.equal(adapters.length, expected.length);
  for (const id of expected) assert.ok(ids.has(id));
  assert.equal(getIndustryAdapter("restaurant").id, "restaurant");
  assert.equal(getIndustryAdapter("saas").id, "saas");
  assert.equal(getIndustryAdapter("unknown").id, "generic_business");
});

test("adapter metrics preserve north-star and guardrail roles", () => {
  for (const adapter of listIndustryAdapters()) {
    assert.ok(adapter.metrics.some((metric) => metric.diagnosticRole === "north_star"), `${adapter.id} needs a north-star metric`);
    assert.ok(adapter.metrics.some((metric) => metric.diagnosticRole === "guardrail"), `${adapter.id} needs a guardrail metric`);
    assert.ok(adapter.growthLevers.length > 0, `${adapter.id} needs growth levers`);
  }
});
