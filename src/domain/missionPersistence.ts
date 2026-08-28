import type { GrowthAction, GrowthMission, GrowthOutcome } from "./growthTypes";

export type MissionRecord = {
  mission: GrowthMission;
  actions: GrowthAction[];
  outcome?: GrowthOutcome;
};

export interface MissionPersistence {
  saveMission(mission: GrowthMission): Promise<void>;
  saveActions(missionId: string, actions: readonly GrowthAction[]): Promise<void>;
  saveOutcome(outcome: GrowthOutcome): Promise<void>;
  getMission(missionId: string): Promise<MissionRecord | null>;
}

export class InMemoryMissionPersistence implements MissionPersistence {
  private readonly records = new Map<string, MissionRecord>();

  async saveMission(mission: GrowthMission): Promise<void> {
    const existing = this.records.get(mission.id);
    this.records.set(mission.id, { mission, actions: existing?.actions ?? mission.actions, outcome: existing?.outcome });
  }

  async saveActions(missionId: string, actions: readonly GrowthAction[]): Promise<void> {
    const existing = this.records.get(missionId);
    if (!existing) throw new Error(`Mission ${missionId} does not exist`);
    this.records.set(missionId, { ...existing, actions: [...actions], mission: { ...existing.mission, actions: [...actions] } });
  }

  async saveOutcome(outcome: GrowthOutcome): Promise<void> {
    const existing = this.records.get(outcome.missionId);
    if (!existing) throw new Error(`Mission ${outcome.missionId} does not exist`);
    this.records.set(outcome.missionId, { ...existing, outcome });
  }

  async getMission(missionId: string): Promise<MissionRecord | null> {
    return this.records.get(missionId) ?? null;
  }
}
