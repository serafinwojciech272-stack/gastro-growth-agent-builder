import type { GrowthAction, GrowthMission, GrowthOutcome } from "./growthTypes";
import { applyApproval } from "./approvalGate";
import { recordMissionOutcome } from "./outcomeEngine";
import type { MissionPersistence } from "./missionPersistence";

export async function persistDraftMission(store: MissionPersistence, mission: GrowthMission): Promise<GrowthMission> {
  await store.saveMission(mission);
  await store.saveActions(mission.id, mission.actions);
  return mission;
}

export async function approveMission(store: MissionPersistence, missionId: string): Promise<GrowthMission> {
  const record = await store.getMission(missionId);
  if (!record) throw new Error(`Mission ${missionId} not found`);
  const result = applyApproval(record.mission, "approve");
  await store.saveMission(result.mission);
  return result.mission;
}

export async function rejectMission(store: MissionPersistence, missionId: string): Promise<GrowthMission> {
  const record = await store.getMission(missionId);
  if (!record) throw new Error(`Mission ${missionId} not found`);
  const result = applyApproval(record.mission, "reject");
  await store.saveMission(result.mission);
  return result.mission;
}

export async function completeMeasurement(
  store: MissionPersistence,
  missionId: string,
  metrics: GrowthOutcome["metrics"],
  confidence: number,
  evidence?: string[],
): Promise<GrowthOutcome> {
  const record = await store.getMission(missionId);
  if (!record) throw new Error(`Mission ${missionId} not found`);
  const measuredMission: GrowthMission = { ...record.mission, status: "measuring" };
  await store.saveMission(measuredMission);
  const outcome = recordMissionOutcome({ mission: measuredMission, metrics, confidence, evidence });
  await store.saveOutcome(outcome);
  await store.saveMission({ ...measuredMission, status: "completed" });
  return outcome;
}

export async function replaceMissionActions(
  store: MissionPersistence,
  missionId: string,
  actions: readonly GrowthAction[],
): Promise<GrowthMission> {
  const record = await store.getMission(missionId);
  if (!record) throw new Error(`Mission ${missionId} not found`);
  await store.saveActions(missionId, actions);
  return { ...record.mission, actions: [...actions] };
}
