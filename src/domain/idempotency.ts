export type IdempotencyRecord = {
  key: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  result?: unknown;
};

export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | undefined>;
  put(record: IdempotencyRecord): Promise<void>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  async get(key: string): Promise<IdempotencyRecord | undefined> {
    return this.records.get(key);
  }

  async put(record: IdempotencyRecord): Promise<void> {
    this.records.set(record.key, record);
  }
}

export function buildIdempotencyKey(input: { businessId: string; missionId: string; actionId: string }): string {
  return `${input.businessId}:${input.missionId}:${input.actionId}`;
}

export async function runIdempotent<T>(
  store: IdempotencyStore,
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const existing = await store.get(key);
  if (existing?.status === "completed") return existing.result as T;
  if (existing?.status === "running") throw new Error(`Idempotent operation already running: ${key}`);

  await store.put({ key, status: "running", startedAt: new Date().toISOString() });
  try {
    const result = await operation();
    await store.put({ key, status: "completed", startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), result });
    return result;
  } catch (error) {
    await store.put({ key, status: "failed", startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), result: error instanceof Error ? { error: error.message } : { error: String(error) } });
    throw error;
  }
}
