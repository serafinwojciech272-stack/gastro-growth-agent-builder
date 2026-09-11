import type { SupabaseClient } from "@supabase/supabase-js";
import { createBusinessKnowledgeGraph, type BusinessKnowledgeGraph } from "./businessKnowledgeGraph";
import type { Business, BusinessEntity, BusinessRelationship, BusinessSignal, Evidence } from "./universalBusinessCore";
import {
  toBusinessEntityRow,
  toBusinessEvidenceRow,
  toBusinessRelationshipRow,
  toBusinessSignalRow,
  type BusinessEntityRow,
  type BusinessEvidenceRow,
  type BusinessRelationshipRow,
  type BusinessSignalRow,
} from "./businessKnowledgeGraphPersistence";

type BaseContext = Pick<BusinessKnowledgeGraph["context"], "activeGoals" | "activeConstraints" | "verticalContext">;

function assertBusinessScope(entityBusinessId: string, businessId: string): void {
  if (entityBusinessId !== businessId) throw new Error("Business scope mismatch.");
}

export async function loadBusinessKnowledgeGraph(
  client: SupabaseClient,
  business: Business,
  baseContext: BaseContext = { activeGoals: [], activeConstraints: [] },
): Promise<BusinessKnowledgeGraph> {
  const [entitiesResult, relationshipsResult, signalsResult, evidenceResult] = await Promise.all([
    client.from("business_entities").select("*").eq("business_id", business.id).order("observed_at", { ascending: false }),
    client.from("business_relationships").select("*").eq("business_id", business.id).order("observed_at", { ascending: false }),
    client.from("business_signals").select("*").eq("business_id", business.id).order("observed_at", { ascending: false }),
    client.from("business_evidence").select("*").eq("business_id", business.id).order("observed_at", { ascending: false }),
  ]);

  const firstError = [entitiesResult, relationshipsResult, signalsResult, evidenceResult].find((result) => result.error)?.error;
  if (firstError) throw new Error(`Knowledge graph load failed: ${firstError.message}`);

  const graph = createBusinessKnowledgeGraph(business, {
    business,
    entities: ((entitiesResult.data ?? []) as BusinessEntityRow[]).map(fromEntityRow),
    relationships: ((relationshipsResult.data ?? []) as BusinessRelationshipRow[]).map(fromRelationshipRow),
    activeGoals: baseContext.activeGoals,
    activeConstraints: baseContext.activeConstraints,
    verticalContext: baseContext.verticalContext,
    lastUpdatedAt: new Date().toISOString(),
  });
  for (const signal of (signalsResult.data ?? []) as BusinessSignalRow[]) graph.signals.push(fromSignalRow(signal));
  for (const evidence of (evidenceResult.data ?? []) as BusinessEvidenceRow[]) graph.evidence.push(fromEvidenceRow(evidence));
  return graph;
}

export async function upsertBusinessEntity(client: SupabaseClient, entity: BusinessEntity): Promise<void> {
  const row = toBusinessEntityRow(entity);
  assertBusinessScope(row.business_id, entity.businessId);
  const { error } = await client.from("business_entities").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`Entity persistence failed: ${error.message}`);
}

export async function upsertBusinessRelationship(client: SupabaseClient, relationship: BusinessRelationship): Promise<void> {
  const row = toBusinessRelationshipRow(relationship);
  assertBusinessScope(row.business_id, relationship.businessId);
  const { error } = await client.from("business_relationships").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`Relationship persistence failed: ${error.message}`);
}

export async function upsertBusinessSignal(client: SupabaseClient, signal: BusinessSignal): Promise<void> {
  const row = toBusinessSignalRow(signal);
  assertBusinessScope(row.business_id, signal.businessId);
  const { error } = await client.from("business_signals").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`Signal persistence failed: ${error.message}`);
}

export async function upsertBusinessEvidence(client: SupabaseClient, evidence: Evidence): Promise<void> {
  const row = toBusinessEvidenceRow(evidence);
  assertBusinessScope(row.business_id, evidence.businessId);
  const { error } = await client.from("business_evidence").upsert(row, { onConflict: "id" });
  if (error) throw new Error(`Evidence persistence failed: ${error.message}`);
}

function fromEntityRow(row: BusinessEntityRow): BusinessEntity {
  return { id: row.id, businessId: row.business_id, type: row.entity_type, name: row.name, attributes: row.attributes, source: row.source ?? undefined, confidence: row.confidence, observedAt: row.observed_at, validFrom: row.valid_from ?? undefined, validTo: row.valid_to ?? undefined };
}
function fromRelationshipRow(row: BusinessRelationshipRow): BusinessRelationship {
  return { id: row.id, businessId: row.business_id, fromEntityId: row.from_entity_id, toEntityId: row.to_entity_id, type: row.relationship_type, confidence: row.confidence, source: row.source ?? undefined, observedAt: row.observed_at };
}
function fromSignalRow(row: BusinessSignalRow): BusinessSignal {
  const value = row.value;
  if (value !== null && typeof value !== "number" && typeof value !== "string" && typeof value !== "boolean") {
    return { id: row.id, businessId: row.business_id, type: row.signal_type, source: row.source, metric: row.metric ?? undefined, baseline: row.baseline ?? undefined, deviation: row.deviation ?? undefined, direction: row.direction, confidence: row.confidence, context: row.context, observedAt: row.observed_at, entityIds: row.entity_ids };
  }
  return { id: row.id, businessId: row.business_id, type: row.signal_type, source: row.source, metric: row.metric ?? undefined, value: value ?? undefined, baseline: row.baseline ?? undefined, deviation: row.deviation ?? undefined, direction: row.direction, confidence: row.confidence, context: row.context, observedAt: row.observed_at, entityIds: row.entity_ids };
}
function fromEvidenceRow(row: BusinessEvidenceRow): Evidence {
  return { id: row.id, businessId: row.business_id, type: row.evidence_type, source: row.source, observation: row.observation, data: row.data ?? undefined, supportingSignalIds: row.supporting_signal_ids, confidence: row.confidence, contradiction: row.contradiction, observedAt: row.observed_at };
}
