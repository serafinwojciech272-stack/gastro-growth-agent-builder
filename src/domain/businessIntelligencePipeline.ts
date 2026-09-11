import type { BusinessContext, BusinessSignal, Diagnosis, Evidence, Opportunity, Recommendation } from "./businessIntelligenceContracts";
import { rankPriorityCandidates } from "./priorityEngine";

export type IntelligencePipelineInput = {
  context: BusinessContext;
  signals: readonly BusinessSignal[];
};

export type IntelligencePipelineResult = {
  evidence: Evidence[];
  diagnoses: Diagnosis[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
  priorities: ReturnType<typeof rankPriorityCandidates>;
};

const scoreConfidence = (confidence: BusinessSignal["confidence"]): number =>
  confidence === "high" ? 90 : confidence === "medium" ? 70 : 45;

const evidenceForSignal = (context: BusinessContext, signal: BusinessSignal): Evidence => ({
  id: `evidence:${signal.id}`,
  businessId: context.businessId,
  signalIds: [signal.id],
  claim: `${signal.metric} changed${signal.deltaPercent === undefined ? "" : ` by ${signal.deltaPercent}%`}.`,
  observation: `${signal.source} reported ${String(signal.value)}${signal.unit ? ` ${signal.unit}` : ""}.`,
  source: signal.source,
  strength: scoreConfidence(signal.confidence),
  confidence: signal.confidence,
  capturedAt: signal.observedAt,
});

export function buildBusinessIntelligence(input: IntelligencePipelineInput): IntelligencePipelineResult {
  const { context, signals } = input;
  const evidence = signals.map((signal) => evidenceForSignal(context, signal));
  const materialSignals = signals.filter((signal) => signal.deltaPercent !== undefined && Math.abs(signal.deltaPercent ?? 0) >= 10);

  const diagnoses: Diagnosis[] = materialSignals.map((signal) => ({
    id: `diagnosis:${signal.id}`,
    businessId: context.businessId,
    title: `${signal.metric} requires attention`,
    problem: `${signal.metric} moved materially against its observed baseline.`,
    mechanism: `The ${signal.source} signal indicates a measurable change that may affect ${context.name}.`,
    evidenceIds: [`evidence:${signal.id}`],
    confidence: signal.confidence,
    confidenceScore: scoreConfidence(signal.confidence),
    affectedDomains: [signal.source],
    status: "active",
    createdAt: signal.observedAt,
  }));

  const opportunities: Opportunity[] = diagnoses.map((diagnosis, index) => {
    const signal = materialSignals[index];
    const magnitude = Math.min(100, Math.round(Math.abs(signal.deltaPercent ?? 0) * 2));
    return {
      id: `opportunity:${signal.id}`,
      businessId: context.businessId,
      diagnosisId: diagnosis.id,
      title: `Improve ${signal.metric}`,
      desiredOutcome: `Reverse the negative movement in ${signal.metric} while protecting business constraints.`,
      impactScore: magnitude,
      confidenceScore: diagnosis.confidenceScore,
      effortScore: 50,
      riskScore: 20,
      urgencyScore: magnitude,
      affectedDomains: diagnosis.affectedDomains,
      status: "active",
      createdAt: signal.observedAt,
    };
  });

  const recommendations: Recommendation[] = opportunities.map((opportunity) => ({
    id: `recommendation:${opportunity.id}`,
    businessId: context.businessId,
    opportunityId: opportunity.id,
    title: `Create a controlled remediation mission for ${opportunity.title.toLowerCase()}`,
    rationale: `Address the diagnosed issue using evidence-backed actions and measure the outcome before expanding automation.`,
    actions: ["Validate diagnosis", "Prepare remediation", "Preview expected changes", "Measure outcome"],
    expectedOutcome: opportunity.desiredOutcome,
    priorityScore: 0,
    confidence: opportunity.confidenceScore >= 80 ? "high" : opportunity.confidenceScore >= 60 ? "medium" : "low",
    risk: "medium",
    requiresApproval: true,
    createdAt: opportunity.createdAt,
  }));

  const priorities = rankPriorityCandidates(opportunities.map((opportunity, index) => ({
    ...opportunity,
    recommendationId: recommendations[index]?.id,
  })));

  return { evidence, diagnoses, opportunities, recommendations, priorities };
}
