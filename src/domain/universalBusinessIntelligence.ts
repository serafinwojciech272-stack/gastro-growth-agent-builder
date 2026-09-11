import type {
  BusinessSignal,
  Diagnosis,
  Evidence,
  Opportunity,
  Recommendation,
} from "./universalBusinessCore";
import { rankOpportunities } from "./universalBusinessCore";

export type DiagnosticInput = {
  businessId: string;
  title: string;
  problem: string;
  symptoms: string[];
  rootCauses: string[];
  impact: string;
  confidence: number;
  signalIds: string[];
  evidenceIds: string[];
  alternatives?: string[];
};

export type OpportunityInput = Omit<Opportunity, "id" | "businessId"> & { id?: string; businessId: string };

export function createDiagnosis(input: DiagnosticInput, now = new Date().toISOString()): Diagnosis {
  return {
    id: `diagnosis:${input.businessId}:${now}`,
    businessId: input.businessId,
    title: input.title,
    problem: input.problem,
    symptoms: [...input.symptoms],
    rootCauses: [...input.rootCauses],
    impact: input.impact,
    confidence: input.confidence,
    signalIds: [...input.signalIds],
    evidenceIds: [...input.evidenceIds],
    alternatives: input.alternatives ? [...input.alternatives] : undefined,
    createdAt: now,
  };
}

export function createOpportunity(input: OpportunityInput): Opportunity {
  return {
    ...input,
    id: input.id ?? `opportunity:${input.businessId}:${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    dependencies: [...input.dependencies],
    relatedKpis: [...input.relatedKpis],
  };
}

export function buildRecommendation(
  opportunity: Opportunity,
  actions: readonly string[],
  evidenceIds: readonly string[],
  policyVersion: string,
): Recommendation {
  return {
    id: `recommendation:${opportunity.id}`,
    businessId: opportunity.businessId,
    opportunityId: opportunity.id,
    title: `Act on ${opportunity.title}`,
    rationale: opportunity.description,
    actions: [...actions],
    expectedOutcome: opportunity.expectedOutcome ?? "Improve the selected business outcome.",
    confidence: opportunity.confidence,
    evidenceIds: [...evidenceIds],
    policyVersion,
  };
}

export type IntelligenceSnapshot = {
  signals: BusinessSignal[];
  evidence: Evidence[];
  diagnoses: Diagnosis[];
  opportunities: Opportunity[];
  recommendations: Recommendation[];
};

export function validateIntelligenceTrace(snapshot: IntelligenceSnapshot): string[] {
  const errors: string[] = [];
  const signalIds = new Set(snapshot.signals.map((s) => s.id));
  const evidenceIds = new Set(snapshot.evidence.map((e) => e.id));
  const diagnosisIds = new Set(snapshot.diagnoses.map((d) => d.id));

  for (const diagnosis of snapshot.diagnoses) {
    if (diagnosis.signalIds.some((id) => !signalIds.has(id))) errors.push(`Diagnosis ${diagnosis.id} references missing signal.`);
    if (diagnosis.evidenceIds.some((id) => !evidenceIds.has(id))) errors.push(`Diagnosis ${diagnosis.id} references missing evidence.`);
  }
  for (const opportunity of snapshot.opportunities) {
    if (opportunity.sourceDiagnosisId && !diagnosisIds.has(opportunity.sourceDiagnosisId)) errors.push(`Opportunity ${opportunity.id} references missing diagnosis.`);
  }
  for (const recommendation of snapshot.recommendations) {
    if (!snapshot.opportunities.some((o) => o.id === recommendation.opportunityId)) errors.push(`Recommendation ${recommendation.id} references missing opportunity.`);
    if (recommendation.evidenceIds.some((id) => !evidenceIds.has(id))) errors.push(`Recommendation ${recommendation.id} references missing evidence.`);
  }
  return errors;
}

export function prioritizeOpportunities(opportunities: readonly Opportunity[]) {
  return rankOpportunities(opportunities);
}
