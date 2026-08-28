export type MemoryKind = "business_fact" | "decision" | "outcome" | "preference" | "lesson";
export type AgentMemory = { id: string; businessId: string; kind: MemoryKind; key: string; value: unknown; confidence: number; updatedAt: string };

export interface MemoryStore { upsert(memory: AgentMemory): Promise<void>; search(businessId: string, kind?: MemoryKind): Promise<AgentMemory[]>; }

export class InMemoryMemoryStore implements MemoryStore {
  private readonly memories = new Map<string, AgentMemory>();
  async upsert(memory: AgentMemory): Promise<void> { this.memories.set(`${memory.businessId}:${memory.kind}:${memory.key}`, memory); }
  async search(businessId: string, kind?: MemoryKind): Promise<AgentMemory[]> {
    return [...this.memories.values()].filter((m) => m.businessId === businessId && (!kind || m.kind === kind));
  }
}
