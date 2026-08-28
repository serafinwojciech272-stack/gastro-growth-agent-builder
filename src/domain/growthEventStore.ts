import type { GrowthEvent } from "./growthEventLog";

export interface GrowthEventStore {
  append(event: GrowthEvent): Promise<void>;
  listByMission(missionId: string): Promise<GrowthEvent[]>;
}

export class InMemoryGrowthEventStore implements GrowthEventStore {
  private readonly events: GrowthEvent[] = [];

  async append(event: GrowthEvent): Promise<void> {
    this.events.push(event);
  }

  async listByMission(missionId: string): Promise<GrowthEvent[]> {
    return this.events.filter((event) => event.missionId === missionId).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }
}
