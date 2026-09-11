import test from "node:test";
import assert from "node:assert/strict";
import type { BusinessContext, Evidence, GrowthDecision, GrowthHypothesis, MissionProposal } from "./universalBusinessCore.ts";
import { rankOpportunities, scoreOpportunity } from "./universalBusinessCore.ts";

const base: BusinessContext["business"] = {
  id: "biz-1", organizationId: "org-1", name: "Universal Test Business", industry: "generic", businessModel: "hybrid",
  locations: [], products: [], services: [], customerSegments: [], competitors: [], goals: [], constraints: [],
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
};

test("universal reasoning contracts preserve epistemic state", () => {
  const evidence: Evidence = {
    id: "e-1", businessId: base.id, type: "measurement", source: "analytics", observation: "Conversion fell 20%.",
    epistemicStatus: "fact", confidence: 0.98, observedAt: "2026-01-02T00:00:00Z",
  };
  const hypothesis: GrowthHypothesis = {
    id: "h-1", businessId: base.id, statement: "Checkout friction is suppressing conversion.", rationale: "Traffic is stable while conversion declined.",
    evidenceIds: [evidence.id], unknowns: ["Device-level error rate"], alternatives: ["Traffic quality changed"], confidence: 0.72,
    testPlan: ["Inspect mobile checkout errors"], status: "open",
  };
  const decision: GrowthDecision = {
    id: "d-1", businessId: base.id, selectedOpportunityId: "o-1", rationale: "Highest expected value with moderate risk.",
    rejectedOpportunityIds: [], confidence: 0.78, evidenceIds: [evidence.id], requiresApproval: true, createdAt: "2026-01-02T00:00:00Z",
  };
  const proposal: MissionProposal = {
    id: "m-1", businessId: base.id, decisionId: decision.id, objective: "Recover conversion", actions: ["Fix checkout friction"],
    kpis: ["conversion"], expectedOutcome: "+15% relative conversion", risk: "medium", requiresApproval: true, proposedAt: "2026-01-02T00:00:00Z",
  };
  assert.equal(evidence.epistemicStatus, "fact");
  assert.equal(hypothesis.evidenceIds[0], evidence.id);
  assert.equal(decision.requiresApproval, true);
  assert.equal(proposal.decisionId, decision.id);
});

test("opportunity ranking remains deterministic and penalizes execution burden", () => {
  const high = { id: "o-high", businessId: base.id, title: "High impact", description: "", impact: 90, urgency: 80, confidence: 0.9, effort: 10, cost: 10, risk: 10, strategicValue: 80, dependencies: [], relatedKpis: [] };
  const burdened = { ...high, id: "o-burdened", effort: 90, cost: 90, risk: 80 };
  assert.ok(scoreOpportunity(high).score > scoreOpportunity(burdened).score);
  assert.deepEqual(rankOpportunities([burdened, high]).map((item) => item.opportunityId), ["o-high", "o-burdened"]);
});
