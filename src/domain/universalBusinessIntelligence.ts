import type {
  BusinessSignal,
  Diagnosis,
  Evidence,
  EvidenceType,
  Opportunity,
  Recommendation,
  SignalDirection,
  SignalType,
} from "./universalBusinessCore";
import { DEFAULT_PRIORITY_POLICY, rankOpportunities } from "./universalBusinessCore";

export type SignalInput = Omit<BusinessSignal, "id" | "businessId"> & {
  id?: string;
  businessId: string;
};

export type EvidenceInput = Omit<Evidence, "id" | "businessId"> & {
  id?: string;
  businessId: string;
};

export type DiagnosticInput = {
  id?: string;
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

export type OpportunityInput = Omit<Opportunity, "id" | "businessId"> & {
  id?: string;
  businessId: string;
};

function createId(prefix: string): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}:${randomUuid ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
}

function normalizeConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`${field} is required.`);
}

export function createSignal(input: SignalInput): BusinessSignal {
  assertNonEmpty(input.businessId, "businessId");
  assertNonEmpty(input.source, "source");
  return {
    ...input,
    id: input.id ?? createId("signal"),
    confidence: normalizeConfidence(input.confidence),
    context: { ...input.context },
    entityIds: unique(input.entityIds ?? []),
  };
}

export function createEvidence(input: EvidenceInput): Evidence {
  assertNonEmpty(input.businessId, "businessId");
  assertNonEmpty(input.source, "source");
  assertNonEmpty(input.observation, "observation");
  return {
    ...input,
    id: input.id ?? createId("evidence"),
    confidence: normalizeConfidence(input.confidence),
    data: input.data ? { ...input.data } : undefined,
    supportingSignalIds: unique(input.supportingSignalIds ?? []),
    contradiction: input.contradiction ?? false,
  };
}

export function createDiagnosis(input: DiagnosticInput, now = new Date().toISOString()): Diagnosis {
  assertNonEmpty(input.businessId, "businessId");
  assertNonEmpty(input.title, "title");
  assertNonEmpty(input.problem, "problem");
  return {
    id: input.id ?? createId("diagnosis"),
    businessId: input.businessId,
    title: input.title,
    problem: input.problem,
    symptoms: unique(input.symptoms),
    rootCauses: unique(input.rootCauses),
    impact: input.impact,
    confidence: normalizeConfidence(input.confidence),
    signalIds: unique(input.signalIds),
    evidenceIds: unique(input.evidenceIds),
    alternatives: input.alternatives ? unique(input.alternatives) : undefined,
    createdAt: now,
  };
}

export function createOpportunity(input: OpportunityInput): Opportunity {
  assertNonEmpty(input.businessId, "businessId");
  assertNonEmpty(input.title, "title");
  if (input.sourceDiagnosisId && !input.sourceDiagnosisId.trim()) {
    throw new Error("sourceDiagnosisId must be non-empty when provided.");
  }
  return {
    ...input,
    id: input.id ?? createId("opportunity"),
    confidence: normalizeConfidence(input.confidence),
    dependencies: unique(input.dependencies),
    relatedKpis: unique(input.relatedKpis),
  };
}

export function buildRecommendation(
  opportunity: Opportunity,
  actions: readonly string[],
  evidenceIds: readonly string[],
  policyVersion = DEFAULT_PRIORITY_POLICY.version,
  id?: string,
): Recommendation {
  assertNonEmpty(opportunity.businessId, "opportunity.businessId");
  assertNonEmpty(opportunity.id, "opportunity.id");
  if (!policyVersion.trim()) throw new Error("policyVersion is required.");
  return {
    id: id ?? createId("recommendation"),
    businessId: opportunity.businessId,
    opportunityId: opportunity.id,
    title: `Act on ${opportunity.title}`,
    rationale: opportunity.description,
    actions: unique(actions),
    expectedOutcome: opportunity.expectedOutcome ?? "Improve the selected business outcome.",
    confidence: normalizeConfidence(opportunity.confidence),
    evidenceIds: unique(evidenceIds),
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

export type IntelligenceTraceErrorCode =
  | "BUSINESS_MISMATCH"
  | "MISSING_REFERENCE"
  | "DUPLICATE_ID"
  | "INVALID_CONFIDENCE"
  | "EMPTY_TRACE";

export type IntelligenceTraceError = {
  code: IntelligenceTraceErrorCode;
  entity: string;
  id?: string;
  message: string;
};

export function validateIntelligenceTrace(snapshot: IntelligenceSnapshot, businessId?: string): string[] {
  return validateIntelligenceTraceDetailed(snapshot, businessId).map((error) => error.message);
}

export function validateIntelligenceTraceDetailed(
  snapshot: IntelligenceSnapshot,
  businessId?: string,
): IntelligenceTraceError[] {
  const errors: IntelligenceTraceError[] = [];
  const expectedBusinessId = businessId ?? inferBusinessId(snapshot);
  if (!expectedBusinessId) {
    return [{ code: "EMPTY_TRACE", entity: "snapshot", message: "Intelligence snapshot has no business identity." }];
  }

  const seen = new Map<string, string>();
  const register = (entity: string, id: string, entityBusinessId: string) => {
    if (entityBusinessId !== expectedBusinessId) {
      errors.push({ code: "BUSINESS_MISMATCH", entity, id, message: `${entity} ${id} belongs to another business.` });
    }
    const previous = seen.get(id);
    if (previous) {
      errors.push({ code: "DUPLICATE_ID", entity, id, message: `ID ${id} is duplicated by ${previous} and ${entity}.` });
    } else {
      seen.set(id, entity);
    }
  };

  for (const signal of snapshot.signals) {
    register("signal", signal.id, signal.businessId);
    if (signal.confidence < 0 || signal.confidence > 1 || !Number.isFinite(signal.confidence)) {
      errors.push({ code: "INVALID_CONFIDENCE", entity: "signal", id: signal.id, message: `Signal ${signal.id} has invalid confidence.` });
    }
  }

  const signalIds = new Set(snapshot.signals.map((signal) => signal.id));
  for (const evidence of snapshot.evidence) {
    register("evidence", evidence.id, evidence.businessId);
    if (evidence.confidence < 0 || evidence.confidence > 1 || !Number.isFinite(evidence.confidence)) {
      errors.push({ code: "INVALID_CONFIDENCE", entity: "evidence", id: evidence.id, message: `Evidence ${evidence.id} has invalid confidence.` });
    }
    for (const signalId of evidence.supportingSignalIds ?? []) {
      if (!signalIds.has(signalId)) errors.push({ code: "MISSING_REFERENCE", entity: "evidence", id: evidence.id, message: `Evidence ${evidence.id} references missing signal ${signalId}.` });
    }
  }

  const evidenceIds = new Set(snapshot.evidence.map((evidence) => evidence.id));
  const diagnosisIds = new Set(snapshot.diagnoses.map((diagnosis) => diagnosis.id));
  for (const diagnosis of snapshot.diagnoses) {
    register("diagnosis", diagnosis.id, diagnosis.businessId);
    for (const signalId of diagnosis.signalIds) {
      if (!signalIds.has(signalId)) errors.push({ code: "MISSING_REFERENCE", entity: "diagnosis", id: diagnosis.id, message: `Diagnosis ${diagnosis.id} references missing signal ${signalId}.` });
    }
    for (const evidenceId of diagnosis.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) errors.push({ code: "MISSING_REFERENCE", entity: "diagnosis", id: diagnosis.id, message: `Diagnosis ${diagnosis.id} references missing evidence ${evidenceId}.` });
    }
  }

  const opportunityIds = new Set(snapshot.opportunities.map((opportunity) => opportunity.id));
  for (const opportunity of snapshot.opportunities) {
    register("opportunity", opportunity.id, opportunity.businessId);
    if (opportunity.sourceDiagnosisId && !diagnosisIds.has(opportunity.sourceDiagnosisId)) {
      errors.push({ code: "MISSING_REFERENCE", entity: "opportunity", id: opportunity.id, message: `Opportunity ${opportunity.id} references missing diagnosis ${opportunity.sourceDiagnosisId}.` });
    }
  }

  for (const recommendation of snapshot.recommendations) {
    register("recommendation", recommendation.id, recommendation.businessId);
    if (!opportunityIds.has(recommendation.opportunityId)) {
      errors.push({ code: "MISSING_REFERENCE", entity: "recommendation", id: recommendation.id, message: `Recommendation ${recommendation.id} references missing opportunity ${recommendation.opportunityId}.` });
    }
    for (const evidenceId of recommendation.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) errors.push({ code: "MISSING_REFERENCE", entity: "recommendation", id: recommendation.id, message: `Recommendation ${recommendation.id} references missing evidence ${evidenceId}.` });
    }
  }

  return errors;
}

function inferBusinessId(snapshot: IntelligenceSnapshot): string | undefined {
  const ids = [
    ...snapshot.signals.map((item) => item.businessId),
    ...snapshot.evidence.map((item) => item.businessId),
    ...snapshot.diagnoses.map((item) => item.businessId),
    ...snapshot.opportunities.map((item) => item.businessId),
    ...snapshot.recommendations.map((item) => item.businessId),
  ];
  return ids.length > 0 && ids.every((id) => id === ids[0]) ? ids[0] : undefined;
}

export type IntelligencePipeline = {
  snapshot: IntelligenceSnapshot;
  priorityScores: ReturnType<typeof rankOpportunities>;
  traceErrors: IntelligenceTraceError[];
};

export function buildIntelligencePipeline(
  snapshot: IntelligenceSnapshot,
  policy = DEFAULT_PRIORITY_POLICY,
): IntelligencePipeline {
  const traceErrors = validateIntelligenceTraceDetailed(snapshot);
  return {
    snapshot,
    priorityScores: rankOpportunities(snapshot.opportunities, policy),
    traceErrors,
  };
}

export function prioritizeOpportunities(opportunities: readonly Opportunity[], policy = DEFAULT_PRIORITY_POLICY) {
  return rankOpportunities(opportunities, policy);
}

export type { EvidenceType, SignalDirection, SignalType };
