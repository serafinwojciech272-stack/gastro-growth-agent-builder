import type { GrowthOutcome, PredictionError } from './growthTypes';

export type MemoryKind = 'fact' | 'decision' | 'outcome' | 'learning' | 'preference' | 'constraint' | 'prediction_error';
export type BusinessMemoryEntry = {
  id: string;
  businessId: string;
  kind: MemoryKind;
  statement: string;
  source: string;
  evidenceIds: string[];
  confidence: number;
  observedAt: string;
  expiresAt?: string;
  supersedesId?: string;
  missionId?: string;
  kpi?: string;
  predictionError?: PredictionError;
  reusable?: boolean;
};

export function isMemoryReusable(entry: BusinessMemoryEntry, now = Date.now()): boolean {
  if (entry.confidence < 50) return false;
  if (entry.expiresAt && Date.parse(entry.expiresAt) <= now) return false;
  if (!entry.evidenceIds.length) return false;
  return entry.reusable !== false;
}

export function deduplicateMemory(entries: readonly BusinessMemoryEntry[]): BusinessMemoryEntry[] {
  const latest = new Map<string, BusinessMemoryEntry>();
  for (const entry of entries) {
    const key = `${entry.businessId}:${entry.kind}:${entry.statement.trim().toLowerCase()}`;
    const current = latest.get(key);
    if (!current || Date.parse(entry.observedAt) > Date.parse(current.observedAt)) latest.set(key, entry);
  }
  return [...latest.values()].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
}

export function memoryFromOutcome(businessId: string, outcome: GrowthOutcome, now = new Date().toISOString()): BusinessMemoryEntry[] {
  const confidence = normalizeConfidence(outcome.confidence);
  const evidenceIds = outcome.evidence ?? [];
  const records: BusinessMemoryEntry[] = [];
  for (const error of outcome.predictionErrors ?? []) {
    const reusable = confidence >= 0.7 && outcome.status !== 'insufficient_data';
    records.push({ id: `${outcome.missionId}:prediction-error:${error.kpi}`, businessId, missionId: outcome.missionId, kind: 'prediction_error', kpi: error.kpi, statement: `${error.kpi}: predicted delta ${format(error.predictedDelta)}, actual delta ${format(error.actualDelta)}, signed error ${format(error.signedError)}.`, source: 'measured_outcome', evidenceIds, confidence: Math.round(Math.min(confidence, error.confidence) * 100), observedAt: now, predictionError: error, reusable });
  }
  for (const [kpi, metric] of Object.entries(outcome.metrics)) {
    if (metric.delta === undefined) continue;
    records.push({ id: `${outcome.missionId}:outcome:${kpi}`, businessId, missionId: outcome.missionId, kind: 'outcome', kpi, statement: `${kpi} changed by ${format(metric.delta)} after the mission. Outcome status: ${outcome.status}.`, source: 'measured_outcome', evidenceIds, confidence: Math.round(confidence * 100), observedAt: now, reusable: confidence >= 0.7 && outcome.status !== 'insufficient_data' });
  }
  return records;
}

export function aggregatePredictionError(entries: readonly BusinessMemoryEntry[], kpi: string) {
  const errors = entries.filter((entry) => entry.kind === 'prediction_error' && entry.kpi === kpi && entry.predictionError).map((entry) => entry.predictionError!);
  if (!errors.length) return null;
  return { kpi, sampleSize: errors.length, meanSignedError: errors.reduce((sum, error) => sum + error.signedError, 0) / errors.length, meanAbsoluteError: errors.reduce((sum, error) => sum + error.absoluteError, 0) / errors.length, directionAccuracy: errors.filter((error) => error.directionCorrect).length / errors.length };
}

function normalizeConfidence(value: number): number { return Number.isFinite(value) ? Math.max(0, Math.min(1, value > 1 ? value / 100 : value)) : 0; }
function format(value: number | undefined): string { return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) : 'unknown'; }
