export type MemoryKind = 'fact' | 'decision' | 'outcome' | 'learning' | 'preference' | 'constraint';
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
};

export function isMemoryReusable(entry: BusinessMemoryEntry, now = Date.now()): boolean {
  if (entry.confidence < 50) return false;
  if (entry.expiresAt && Date.parse(entry.expiresAt) <= now) return false;
  return entry.evidenceIds.length > 0;
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
