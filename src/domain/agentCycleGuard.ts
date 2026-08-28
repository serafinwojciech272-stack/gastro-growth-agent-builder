import type { GrowthMission, MissionStatus } from "./growthTypes";

const ACTIVE: ReadonlySet<MissionStatus> = new Set(["executing", "measuring"]);

export function assertSingleActiveMission(missions: readonly GrowthMission[], businessId: string): void {
  const active = missions.filter((mission) => mission.businessId === businessId && ACTIVE.has(mission.status));
  if (active.length > 1) {
    throw new Error(`Invariant violation: business ${businessId} has ${active.length} active missions`);
  }
}

export function hasActiveMission(missions: readonly GrowthMission[], businessId: string): boolean {
  return missions.some((mission) => mission.businessId === businessId && ACTIVE.has(mission.status));
}
