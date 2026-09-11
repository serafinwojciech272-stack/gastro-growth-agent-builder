import type { SupabaseClient } from "@supabase/supabase-js";
import type { Diagnosis, Opportunity, PriorityScore, Recommendation } from "./universalBusinessCore";

export type BusinessDiagnosisRow = { id: string; business_id: string; title: string; problem: string; symptoms: string[]; root_causes: string[]; impact: string; confidence: number; signal_ids: string[]; evidence_ids: string[]; alternatives: string[]; created_at: string; updated_at: string };
export type BusinessOpportunityRow = { id: string; business_id: string; title: string; description: string; source_diagnosis_id: string | null; impact: number; urgency: number; confidence: number; effort: number; cost: number; risk: number; roi: number | null; strategic_value: number; time_to_result_days: number | null; dependencies: string[]; expected_outcome: string | null; related_kpis: string[]; created_at: string; updated_at: string };
export type BusinessRecommendationRow = { id: string; business_id: string; opportunity_id: string; title: string; rationale: string; actions: string[]; expected_outcome: string; confidence: number; evidence_ids: string[]; policy_version: string; created_at: string; updated_at: string };
export type BusinessPriorityScoreRow = { id: string; business_id: string; opportunity_id: string; score: number; rank: number | null; policy_version: string; factors: Record<string, number>; explanation: string; created_at: string };

export type BusinessIntelligenceArtifacts = { diagnoses: Diagnosis[]; opportunities: Opportunity[]; recommendations: Recommendation[]; priorities: PriorityScore[] };

function assertBusinessScope(rowBusinessId: string, businessId: string): void { if (rowBusinessId !== businessId) throw new Error("Business scope mismatch."); }

export function toBusinessDiagnosisRow(value: Diagnosis): BusinessDiagnosisRow { return { id: value.id, business_id: value.businessId, title: value.title, problem: value.problem, symptoms: value.symptoms, root_causes: value.rootCauses, impact: value.impact, confidence: normalizeConfidence(value.confidence), signal_ids: value.signalIds, evidence_ids: value.evidenceIds, alternatives: value.alternatives ?? [], created_at: value.createdAt, updated_at: value.createdAt }; }
export function toBusinessOpportunityRow(value: Opportunity): BusinessOpportunityRow { return { id: value.id, business_id: value.businessId, title: value.title, description: value.description, source_diagnosis_id: value.sourceDiagnosisId ?? null, impact: value.impact, urgency: value.urgency, confidence: normalizeConfidence(value.confidence), effort: value.effort, cost: value.cost, risk: value.risk, roi: value.roi ?? null, strategic_value: value.strategicValue, time_to_result_days: value.timeToResultDays ?? null, dependencies: value.dependencies, expected_outcome: value.expectedOutcome ?? null, related_kpis: value.relatedKpis, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; }
export function toBusinessRecommendationRow(value: Recommendation): BusinessRecommendationRow { return { id: value.id, business_id: value.businessId, opportunity_id: value.opportunityId, title: value.title, rationale: value.rationale, actions: value.actions, expected_outcome: value.expectedOutcome, confidence: normalizeConfidence(value.confidence), evidence_ids: value.evidenceIds, policy_version: value.policyVersion, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; }
export function toBusinessPriorityScoreRow(value: PriorityScore, businessId: string): BusinessPriorityScoreRow { assertBusinessScope(businessId, businessId); return { id: `${businessId}:${value.opportunityId}:${value.policyVersion}`, business_id: businessId, opportunity_id: value.opportunityId, score: value.score, rank: value.rank ?? null, policy_version: value.policyVersion, factors: value.factors, explanation: value.explanation, created_at: new Date().toISOString() }; }

export async function persistBusinessIntelligenceArtifacts(client: SupabaseClient, artifacts: BusinessIntelligenceArtifacts): Promise<void> {
  for (const diagnosis of artifacts.diagnoses) { const row = toBusinessDiagnosisRow(diagnosis); assertBusinessScope(row.business_id, diagnosis.businessId); const { error } = await client.from("business_diagnoses").upsert(row, { onConflict: "id" }); if (error) throw new Error(`Diagnosis persistence failed: ${error.message}`); }
  for (const opportunity of artifacts.opportunities) { const row = toBusinessOpportunityRow(opportunity); assertBusinessScope(row.business_id, opportunity.businessId); const { error } = await client.from("business_opportunities").upsert(row, { onConflict: "id" }); if (error) throw new Error(`Opportunity persistence failed: ${error.message}`); }
  for (const recommendation of artifacts.recommendations) { const row = toBusinessRecommendationRow(recommendation); assertBusinessScope(row.business_id, recommendation.businessId); const { error } = await client.from("business_recommendations").upsert(row, { onConflict: "id" }); if (error) throw new Error(`Recommendation persistence failed: ${error.message}`); }
  for (const priority of artifacts.priorities) { const businessId = artifacts.opportunities.find((opportunity) => opportunity.id === priority.opportunityId)?.businessId; if (!businessId) throw new Error(`Priority ${priority.opportunityId} references an unknown opportunity.`); const row = toBusinessPriorityScoreRow(priority, businessId); const { error } = await client.from("business_priority_scores").upsert(row, { onConflict: "opportunity_id,policy_version" }); if (error) throw new Error(`Priority persistence failed: ${error.message}`); }
}

export async function loadBusinessIntelligenceArtifacts(client: SupabaseClient, businessId: string): Promise<BusinessIntelligenceArtifacts> {
  const [diagnosesResult, opportunitiesResult, recommendationsResult, prioritiesResult] = await Promise.all([
    client.from("business_diagnoses").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
    client.from("business_opportunities").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
    client.from("business_recommendations").select("*").eq("business_id", businessId).order("created_at", { ascending: false }),
    client.from("business_priority_scores").select("*").eq("business_id", businessId).order("score", { ascending: false }),
  ]);
  const firstError = [diagnosesResult, opportunitiesResult, recommendationsResult, prioritiesResult].find((result) => result.error)?.error;
  if (firstError) throw new Error(`Intelligence artifact load failed: ${firstError.message}`);
  return {
    diagnoses: ((diagnosesResult.data ?? []) as BusinessDiagnosisRow[]).map(fromDiagnosisRow),
    opportunities: ((opportunitiesResult.data ?? []) as BusinessOpportunityRow[]).map(fromOpportunityRow),
    recommendations: ((recommendationsResult.data ?? []) as BusinessRecommendationRow[]).map(fromRecommendationRow),
    priorities: ((prioritiesResult.data ?? []) as BusinessPriorityScoreRow[]).map(fromPriorityRow),
  };
}

function normalizeConfidence(value: number): number { return Math.max(0, Math.min(1, Number.isFinite(value) ? (value > 1 ? value / 100 : value) : 0)); }
function fromDiagnosisRow(row: BusinessDiagnosisRow): Diagnosis { return { id: row.id, businessId: row.business_id, title: row.title, problem: row.problem, symptoms: row.symptoms, rootCauses: row.root_causes, impact: row.impact, confidence: row.confidence, signalIds: row.signal_ids, evidenceIds: row.evidence_ids, alternatives: row.alternatives, createdAt: row.created_at }; }
function fromOpportunityRow(row: BusinessOpportunityRow): Opportunity { return { id: row.id, businessId: row.business_id, title: row.title, description: row.description, sourceDiagnosisId: row.source_diagnosis_id ?? undefined, impact: row.impact, urgency: row.urgency, confidence: row.confidence, effort: row.effort, cost: row.cost, risk: row.risk, roi: row.roi ?? undefined, strategicValue: row.strategic_value, timeToResultDays: row.time_to_result_days ?? undefined, dependencies: row.dependencies, expectedOutcome: row.expected_outcome ?? undefined, relatedKpis: row.related_kpis }; }
function fromRecommendationRow(row: BusinessRecommendationRow): Recommendation { return { id: row.id, businessId: row.business_id, opportunityId: row.opportunity_id, title: row.title, rationale: row.rationale, actions: row.actions, expectedOutcome: row.expected_outcome, confidence: row.confidence, evidenceIds: row.evidence_ids, policyVersion: row.policy_version }; }
function fromPriorityRow(row: BusinessPriorityScoreRow): PriorityScore { return { opportunityId: row.opportunity_id, score: row.score, rank: row.rank ?? undefined, policyVersion: row.policy_version, factors: row.factors, explanation: row.explanation }; }
