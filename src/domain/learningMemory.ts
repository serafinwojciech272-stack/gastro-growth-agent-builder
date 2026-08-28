import type { GrowthOutcome, GrowthDecisionContext } from "./growthTypes";
import { learnFromOutcomes, type LearningRecommendation } from "./learningEngine";

export type LearningMemoryEntry = {
  id: string;
  businessId: string;
  missionId: string;
  kpi: string;
  recommendation: LearningRecommendation["recommendation"];
  confidence: number;
  sampleSize: number;
  evidence: string[];
  createdAt: string;
};

export type LearningMemoryStore = {
  getByBusiness: (businessId: string) => LearningMemoryEntry[];
  save: (entry: LearningMemoryEntry) => void;
};

export function recordLearning(
  context: GrowthDecisionContext,
  missionId: string,
  outcomes: readonly GrowthOutcome[],
  store: LearningMemoryStore,
): LearningMemoryEntry[] {
  const recommendations = learnFromOutcomes(context, outcomes);
  const now = new Date().toISOString();
  const entries = recommendations.map((item) => ({
    id: `${context.businessId}:${missionId}:${item.signal.kpi}:${now}`,
    businessId: context.businessId,
    missionId,
    kpi: item.signal.kpi,
    recommendation: item.recommendation,
    confidence: item.signal.confidence,
    sampleSize: item.signal.sampleSize,
    evidence: item.signal.evidence,
    createdAt: now,
  }));
  for (const entry of entries) store.save(entry);
  return entries;
}

export function getLearningContext(businessId: string, store: LearningMemoryStore): LearningMemoryEntry[] {
  return store.getByBusiness(businessId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
