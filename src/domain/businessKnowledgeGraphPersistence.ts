import type {
  BusinessEntity,
  BusinessRelationship,
  BusinessSignal,
  Evidence,
} from "./universalBusinessCore";

/** DB row shapes for the Universal Business Knowledge Graph. */
export type BusinessEntityRow = {
  id: string;
  business_id: string;
  entity_type: BusinessEntity["type"];
  name: string;
  attributes: Record<string, unknown>;
  source: string | null;
  confidence: number;
  observed_at: string;
  valid_from: string | null;
  valid_to: string | null;
};

export type BusinessRelationshipRow = {
  id: string;
  business_id: string;
  from_entity_id: string;
  to_entity_id: string;
  relationship_type: BusinessRelationship["type"];
  confidence: number;
  source: string | null;
  observed_at: string;
};

export type BusinessSignalRow = {
  id: string;
  business_id: string;
  signal_type: BusinessSignal["type"];
  source: string;
  metric: string | null;
  value: unknown;
  baseline: number | null;
  deviation: number | null;
  direction: BusinessSignal["direction"];
  confidence: number;
  context: Record<string, unknown>;
  observed_at: string;
  entity_ids: string[];
};

export type BusinessEvidenceRow = {
  id: string;
  business_id: string;
  evidence_type: Evidence["type"];
  source: string;
  observation: string;
  data: Record<string, unknown> | null;
  supporting_signal_ids: string[];
  confidence: number;
  contradiction: boolean;
  observed_at: string;
};

export function toBusinessEntityRow(entity: BusinessEntity): BusinessEntityRow {
  return {
    id: entity.id,
    business_id: entity.businessId,
    entity_type: entity.type,
    name: entity.name,
    attributes: entity.attributes,
    source: entity.source ?? null,
    confidence: entity.confidence,
    observed_at: entity.observedAt,
    valid_from: entity.validFrom ?? null,
    valid_to: entity.validTo ?? null,
  };
}

export function toBusinessRelationshipRow(relationship: BusinessRelationship): BusinessRelationshipRow {
  return {
    id: relationship.id,
    business_id: relationship.businessId,
    from_entity_id: relationship.fromEntityId,
    to_entity_id: relationship.toEntityId,
    relationship_type: relationship.type,
    confidence: relationship.confidence,
    source: relationship.source ?? null,
    observed_at: relationship.observedAt,
  };
}

export function toBusinessSignalRow(signal: BusinessSignal): BusinessSignalRow {
  return {
    id: signal.id,
    business_id: signal.businessId,
    signal_type: signal.type,
    source: signal.source,
    metric: signal.metric ?? null,
    value: signal.value ?? null,
    baseline: signal.baseline ?? null,
    deviation: signal.deviation ?? null,
    direction: signal.direction,
    confidence: signal.confidence,
    context: signal.context,
    observed_at: signal.observedAt,
    entity_ids: signal.entityIds ?? [],
  };
}

export function toBusinessEvidenceRow(evidence: Evidence): BusinessEvidenceRow {
  return {
    id: evidence.id,
    business_id: evidence.businessId,
    evidence_type: evidence.type,
    source: evidence.source,
    observation: evidence.observation,
    data: evidence.data ?? null,
    supporting_signal_ids: evidence.supportingSignalIds ?? [],
    confidence: evidence.confidence,
    contradiction: evidence.contradiction ?? false,
    observed_at: evidence.observedAt,
  };
}
