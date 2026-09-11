import type {
  BusinessContext,
  BusinessSignal,
  Diagnosis,
  Evidence,
  Opportunity,
  Recommendation,
  PriorityScore,
} from "./universalBusinessCore";
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
  priorities: PriorityScore[];
};

const confidence100 = (confidence: number): number => Math.max(0, Math.min(100, confidence <= 1 ? confidence * 100 : confidence));
const material = (signal: BusinessSignal): boolean => signal.deviation !== undefined && Math.abs(signal.deviation) >= 10;

const evidenceForSignal = (signal: BusinessSignal): Evidence => ({
  id: `evidence:${signal.id}`,
  businessId: signal.businessId,
  type: "measurement",
  source: signal.source,
  observation: `${signal.metric ?? signal.type} reported ${String(signal.value)}${signal.deviation === undefined ? "" : ` with ${signal.deviation} deviation`}.`,
  data: {
    metric: signal.metric,
    value: signal.value,
    baseline: signal.baseline,
    deviation: signal.deviation,
    direction: signal.direction,
  },
  supportingSignalIds: [signal.id],
  confidence: confidence100(signal.confidence),
  observedAt: signal.observedAt,
});

export function buildBusinessIntelligence(input: IntelligencePipelineInput): IntelligencePipelineResult {
  const { context, signals } = input;
  const evidence = signals.map(evidenceForSignal);
  const materialSignals = signals.filter(material);

  const diagnoses: Diagnosis[] = materialSignals.map((signal) => {
    const metric = signal.metric ?? signal.type;
    const negative = signal.direction === "negative" || (signal.deviation ?? 0) < 0;
    return {
      id: `diagnosis:${signal.id}`,
      businessId: context.business.id,
      title: `${metric} requires attention`,
      problem: `${metric} moved materially ${negative ? "against" : "from"} its observed baseline.`,
      symptoms: [`${metric}: ${String(signal.value)}`, `Deviation: ${signal.deviation ?? "n/a"}`],
      rootCauses: ["Root cause requires validation against business context and supporting evidence."],
      impact: `Potential impact on ${context.business.name} requires measurement.`,
      confidence: confidence100(signal.confidence),
      signalIds: [signal.id],
      evidenceIds: [`evidence:${signal.id}`],
      alternatives: ["Measurement error", "Temporary market or operational change"],
      createdAt: signal.observedAt,
    };
  });

  const opportunities: Opportunity[] = materialSignals.map((signal, index) => {
    const diagnosis = diagnoses[index];
    const magnitude = Math.min(100, Math.round(Math.abs(signal.deviation ?? 0) * 2));
    return {
      id: `opportunity:${signal.id}`,
      businessId: context.business.id,
      title: `Improve ${signal.metric ?? signal.type}`,
      description: `Investigate and improve the diagnosed ${signal.metric ?? signal.type} movement without violating active business constraints.`,
      sourceDiagnosisId: diagnosis.id,
      impact: magnitude,
      urgency: magnitude,
      confidence: confidence100(signal.confidence),
      effort: 50,
      cost: 30,
      risk: 20,
      roi: magnitude,
      strategicValue: 50,
      timeToResultDays: 30,
      dependencies: [],
      expectedOutcome: `Reverse the adverse movement in ${signal.metric ?? signal.type} and verify the result with a measured outcome.`,
      relatedKpis: [signal.metric ?? signal.type],
    };
  });

  const recommendations: Recommendation[] = opportunities.map((opportunity) => ({
    id: `recommendation:${opportunity.id}`,
    businessId: context.business.id,
    opportunityId: opportunity.id,
    title: `Create a controlled remediation mission for ${opportunity.title.toLowerCase()}`,
    rationale: "Use evidence-backed preparation, preview the proposed change, require approval, then measure the outcome before increasing automation.",
    actions: ["Validate diagnosis", "Prepare remediation", "Preview expected changes", "Measure outcome"],
    expectedOutcome: opportunity.expectedOutcome ?? "Measure improvement against the baseline.",
    confidence: opportunity.confidence,
    evidenceIds: opportunity.sourceDiagnosisId ? [`evidence:${opportunity.sourceDiagnosisId.replace("diagnosis:", "")}`] : [],
    policyVersion: "priority-v1",
  }));

  const priorities = rankPriorityCandidates(opportunities);
  return { evidence, diagnoses, opportunities, recommendations, priorities };
}
