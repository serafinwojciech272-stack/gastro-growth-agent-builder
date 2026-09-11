import { test, expect } from "@playwright/test";
import { buildBusinessIntelligence } from "../src/domain/businessIntelligencePipeline";
import { adaptBusinessIntelligenceToMission } from "../src/domain/businessIntelligenceMissionAdapter";
import { buildBusinessKnowledgeGraph } from "../src/domain/businessKnowledgeGraph";
import type { BusinessContext, BusinessSignal } from "../src/domain/universalBusinessCore";

test("universal intelligence contracts form a controlled signal-to-mission path", () => {
  const context: BusinessContext = {
    business: {
      id: "business-test",
      organizationId: "org-test",
      name: "Test Business",
      industry: "restaurant",
      businessModel: "b2c",
      locations: ["Gliwice"],
      products: ["Core offer"],
      services: ["Service"],
      customerSegments: ["Local customers"],
      competitors: ["Competitor"],
      goals: [{
        id: "goal-1",
        businessId: "business-test",
        title: "Increase conversion",
        metric: "conversion_rate",
        priority: 90,
        status: "active",
      }],
      constraints: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    entities: [],
    relationships: [],
    activeGoals: [],
    activeConstraints: [],
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
  };

  const signals: BusinessSignal[] = [{
    id: "signal-1",
    businessId: "business-test",
    type: "metric_change",
    source: "website",
    metric: "conversion_rate",
    value: 2.1,
    baseline: 2.6,
    deviation: -19.2,
    direction: "negative",
    confidence: 0.9,
    context: { fixture: true },
    observedAt: "2026-01-02T00:00:00.000Z",
  }];

  const graph = buildBusinessKnowledgeGraph(context, signals);
  const intelligence = buildBusinessIntelligence({ context, signals });
  const mission = adaptBusinessIntelligenceToMission({
    context,
    signals,
    recommendations: intelligence.recommendations,
  });

  expect(graph.entities.some((entity) => entity.id === "business-test")).toBeTruthy();
  expect(graph.entities.some((entity) => entity.type === "metric" || entity.type === "other")).toBeTruthy();
  expect(intelligence.evidence).toHaveLength(1);
  expect(intelligence.diagnoses).toHaveLength(1);
  expect(intelligence.opportunities).toHaveLength(1);
  expect(intelligence.recommendations[0]?.requiresApproval).toBeUndefined();
  expect(mission.opportunitySignals).toHaveLength(1);
  expect(mission.actions.length).toBeGreaterThan(0);
  expect(mission.actions.every((action) => action.requiresApproval)).toBeTruthy();
  expect(mission.decisionContext.businessId).toBe("business-test");
});
