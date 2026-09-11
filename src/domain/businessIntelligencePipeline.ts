import type { BusinessContext, BusinessSignal, Diagnosis, Evidence, Opportunity, Recommendation, PriorityScore } from "./universalBusinessCore";
import { createDiagnosis, createEvidence, createOpportunity, buildRecommendation, prioritizeOpportunities, validateIntelligenceTrace } from "./universalBusinessIntelligence";

export type IntelligencePipelineInput = { context: BusinessContext; signals: readonly BusinessSignal[] };
export type IntelligencePipelineResult = { evidence: Evidence[]; diagnoses: Diagnosis[]; opportunities: Opportunity[]; recommendations: Recommendation[]; priorities: PriorityScore[]; traceErrors: string[] };
const material = (signal: BusinessSignal): boolean => signal.deviation !== undefined && Math.abs(signal.deviation) >= 10;

export function buildBusinessIntelligence(input: IntelligencePipelineInput): IntelligencePipelineResult {
  const { context, signals } = input;
  const scopedSignals = signals.filter((signal) => signal.businessId === context.business.id);
  const evidence = scopedSignals.map((signal) => createEvidence({
    id: `evidence:${signal.id}`,
    businessId: signal.businessId,
    type: "measurement",
    source: signal.source,
    observation: `${signal.metric ?? signal.type} reported ${String(signal.value)}${signal.deviation === undefined ? "" : ` with ${signal.deviation} deviation`}.`,
    data: { metric: signal.metric, value: signal.value, baseline: signal.baseline, deviation: signal.deviation, direction: signal.direction },
    supportingSignalIds: [signal.id],
    confidence: signal.confidence,
    observedAt: signal.observedAt,
  }));
  const materialSignals = scopedSignals.filter(material);
  const diagnoses = materialSignals.map((signal) => {
    const metric = signal.metric ?? signal.type;
    const negative = signal.direction === "negative" || (signal.deviation ?? 0) < 0;
    return createDiagnosis({
      id: `diagnosis:${signal.id}`,
      businessId: context.business.id,
      title: `${metric} requires attention`,
      problem: `${metric} moved materially ${negative ? "against" : "from"} its observed baseline.`,
      symptoms: [`${metric}: ${String(signal.value)}`, `Deviation: ${signal.deviation ?? "n/a"}`],
      rootCauses: ["Root cause requires validation against business context and supporting evidence."],
      impact: `Potential impact on ${context.business.name} requires measurement.`,
      confidence: signal.confidence,
      signalIds: [signal.id],
      evidenceIds: [`evidence:${signal.id}`],
      alternatives: ["Measurement error", "Temporary market or operational change"],
    }, signal.observedAt);
  });
  const opportunities = materialSignals.map((signal, index) => {
    const diagnosis = diagnoses[index];
    const magnitude = Math.min(100, Math.round(Math.abs(signal.deviation ?? 0) * 2));
    return createOpportunity({
      id: `opportunity:${signal.id}`,
      businessId: context.business.id,
      title: `Improve ${signal.metric ?? signal.type}`,
      description: `Investigate and improve the diagnosed ${signal.metric ?? signal.type} movement without violating active business constraints.`,
      sourceDiagnosisId: diagnosis.id,
      impact: magnitude,
      urgency: magnitude,
      confidence: signal.confidence,
      effort: 50,
      cost: 30,
      risk: 20,
      roi: magnitude,
      strategicValue: 50,
      timeToResultDays: 30,
      dependencies: [],
      expectedOutcome: `Reverse the adverse movement in ${signal.metric ?? signal.type} and verify the result with a measured outcome.`,
      relatedKpis: [signal.metric ?? signal.type],
    });
  });
  const recommendations = opportunities.map((opportunity) => {
    const recommendation = buildRecommendation(opportunity, ["Validate diagnosis", "Prepare remediation", "Preview expected changes", "Measure outcome"], opportunity.sourceDiagnosisId ? [`evidence:${opportunity.sourceDiagnosisId.replace("diagnosis:", "")}`] : [], "priority-v1", `recommendation:${opportunity.id}`);
    return { ...recommendation, title: `Create a controlled remediation mission for ${opportunity.title.toLowerCase()}`, rationale: "Use evidence-backed preparation, preview the proposed change, require approval, then measure the outcome before increasing automation." };
  });
  const snapshot = { signals: scopedSignals, evidence, diagnoses, opportunities, recommendations };
  return { ...snapshot, priorities: prioritizeOpportunities(opportunities), traceErrors: validateIntelligenceTrace(snapshot, context.business.id) };
}
