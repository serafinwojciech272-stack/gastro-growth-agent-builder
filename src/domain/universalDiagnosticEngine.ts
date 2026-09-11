import type {
  BusinessSignal,
  Diagnosis,
  Evidence,
  Opportunity,
  Recommendation,
} from "./universalBusinessCore";
import { buildRecommendation, createDiagnosis, createEvidence, createOpportunity } from "./universalBusinessIntelligence";
import { rankOpportunities } from "./universalBusinessCore";

export type DiagnosticEngineConfig = {
  minimumConfidence: number;
  negativeSignalThreshold: number;
  defaultEffort: number;
  defaultCost: number;
  defaultRisk: number;
  defaultTimeToResultDays: number;
};

export const DEFAULT_DIAGNOSTIC_ENGINE_CONFIG: DiagnosticEngineConfig = {
  minimumConfidence: 0.35,
  negativeSignalThreshold: -0.05,
  defaultEffort: 35,
  defaultCost: 25,
  defaultRisk: 20,
  defaultTimeToResultDays: 14,
};

export type DiagnosticCycle = {
  evidence: Evidence[];
  diagnoses: Diagnosis[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
  priorities: ReturnType<typeof rankOpportunities>;
};

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function normalizeConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? (value > 1 ? value / 100 : value) : 0));
}

function severity(signal: BusinessSignal): number {
  const deviation = signal.deviation;
  if (typeof deviation === "number" && Number.isFinite(deviation)) return clamp100(Math.abs(deviation) * 100);
  if (signal.direction === "negative") return 65;
  if (signal.type === "anomaly" || signal.type === "threshold_breach") return 60;
  return 25;
}

function isDiagnosticSignal(signal: BusinessSignal, config: DiagnosticEngineConfig): boolean {
  if (normalizeConfidence(signal.confidence) < config.minimumConfidence) return false;
  if (signal.direction === "negative") return true;
  if (signal.type === "anomaly" || signal.type === "threshold_breach") return true;
  return typeof signal.deviation === "number" && signal.deviation <= config.negativeSignalThreshold;
}

function groupKey(signal: BusinessSignal): string {
  return signal.metric?.trim().toLowerCase() || signal.type;
}

export function buildEvidenceFromSignals(
  businessId: string,
  signals: readonly BusinessSignal[],
): Evidence[] {
  return signals
    .filter((signal) => signal.businessId === businessId)
    .map((signal) =>
      createEvidence({
        businessId,
        type: "measurement",
        source: signal.source,
        observation: signal.metric
          ? `${signal.metric} produced a ${signal.direction} ${signal.type} signal.`
          : `Source ${signal.source} produced a ${signal.direction} ${signal.type} signal.`,
        data: {
          signalType: signal.type,
          metric: signal.metric,
          value: signal.value,
          baseline: signal.baseline,
          deviation: signal.deviation,
          direction: signal.direction,
          context: signal.context,
        },
        supportingSignalIds: [signal.id],
        confidence: signal.confidence,
        observedAt: signal.observedAt,
      }),
    );
}

export function diagnoseBusinessSignals(
  businessId: string,
  signals: readonly BusinessSignal[],
  evidence: readonly Evidence[],
  config: DiagnosticEngineConfig = DEFAULT_DIAGNOSTIC_ENGINE_CONFIG,
): Diagnosis[] {
  const candidates = signals.filter((signal) => signal.businessId === businessId && isDiagnosticSignal(signal, config));
  const evidenceBySignal = new Map<string, Evidence>();
  for (const item of evidence) {
    for (const signalId of item.supportingSignalIds ?? []) evidenceBySignal.set(signalId, item);
  }

  const groups = new Map<string, BusinessSignal[]>();
  for (const signal of candidates) {
    const key = groupKey(signal);
    const group = groups.get(key) ?? [];
    group.push(signal);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, group]) => {
    const signalIds = group.map((signal) => signal.id);
    const evidenceIds = group.map((signal) => evidenceBySignal.get(signal.id)?.id).filter((id): id is string => Boolean(id));
    const confidence = group.reduce((sum, signal) => sum + normalizeConfidence(signal.confidence), 0) / group.length;
    const maxSeverity = Math.max(...group.map(severity));
    const label = group[0]?.metric || key;

    return createDiagnosis({
      businessId,
      title: `${label} requires attention`,
      problem: `Observed business signals indicate a negative or anomalous condition around ${label}.`,
      symptoms: group.map((signal) => `${signal.type}: ${signal.direction}`),
      rootCauses: ["Root cause not yet established; validate against additional evidence."],
      impact: `Observed severity ${maxSeverity.toFixed(0)}/100.`,
      confidence,
      signalIds,
      evidenceIds,
      alternatives: ["Signal may be transient or caused by incomplete measurement coverage."],
    });
  });
}

export function deriveOpportunitiesFromDiagnoses(
  businessId: string,
  diagnoses: readonly Diagnosis[],
  signals: readonly BusinessSignal[],
  config: DiagnosticEngineConfig = DEFAULT_DIAGNOSTIC_ENGINE_CONFIG,
): Opportunity[] {
  const signalById = new Map(signals.filter((signal) => signal.businessId === businessId).map((signal) => [signal.id, signal]));

  return diagnoses
    .filter((diagnosis) => diagnosis.businessId === businessId)
    .map((diagnosis) => {
      const linkedSignals = diagnosis.signalIds.map((id) => signalById.get(id)).filter((signal): signal is BusinessSignal => Boolean(signal));
      const impact = clamp100(Math.max(45, ...linkedSignals.map(severity)));
      const confidence = normalizeConfidence(diagnosis.confidence);
      const urgency = clamp100(linkedSignals.some((signal) => signal.type === "threshold_breach") ? 80 : impact);

      return createOpportunity({
        businessId,
        title: `Improve ${diagnosis.title.replace(/ requires attention$/i, "")}`,
        description: `Address the diagnosed condition while validating the stated root cause with additional evidence.`,
        sourceDiagnosisId: diagnosis.id,
        impact,
        urgency,
        confidence,
        effort: config.defaultEffort,
        cost: config.defaultCost,
        risk: config.defaultRisk,
        roi: clamp100(impact * confidence),
        strategicValue: clamp100(impact * 0.8),
        timeToResultDays: config.defaultTimeToResultDays,
        dependencies: [],
        expectedOutcome: `Reduce the negative signal severity for ${diagnosis.title.replace(/ requires attention$/i, "")}.`,
        relatedKpis: linkedSignals.map((signal) => signal.metric).filter((metric): metric is string => Boolean(metric)),
      });
    });
}

export function runDiagnosticCycle(
  businessId: string,
  signals: readonly BusinessSignal[],
  evidence: readonly Evidence[] = [],
  config: DiagnosticEngineConfig = DEFAULT_DIAGNOSTIC_ENGINE_CONFIG,
): DiagnosticCycle {
  const scopedSignals = signals.filter((signal) => signal.businessId === businessId);
  const generatedEvidence = buildEvidenceFromSignals(businessId, scopedSignals);
  const mergedEvidence = [...evidence.filter((item) => item.businessId === businessId), ...generatedEvidence];
  const dedupedEvidence = [...new Map(mergedEvidence.map((item) => [item.id, item])).values()];
  const diagnoses = diagnoseBusinessSignals(businessId, scopedSignals, dedupedEvidence, config);
  const opportunities = deriveOpportunitiesFromDiagnoses(businessId, diagnoses, scopedSignals, config);
  const recommendations = opportunities.map((opportunity) => {
    const diagnosis = diagnoses.find((item) => item.id === opportunity.sourceDiagnosisId);
    return buildRecommendation(opportunity, [
      "Validate the diagnosis with additional evidence.",
      `Execute a controlled improvement for ${opportunity.title}.`,
      "Measure the KPI before and after execution.",
    ], diagnosis?.evidenceIds ?? []);
  });

  return {
    evidence: dedupedEvidence,
    diagnoses,
    opportunities,
    recommendations,
    priorities: rankOpportunities(opportunities),
  };
}
