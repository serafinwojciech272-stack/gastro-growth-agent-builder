import type { GrowthAction, GrowthMission, GrowthOutcome } from "./growthTypes";
import { applyApproval } from "./approvalGate";
import { recordMissionOutcome } from "./outcomeEngine";
import { transitionMission } from "./missionStateMachine";
import type { MissionPersistence } from "./missionPersistence";

export async function persistDraftMission(store: MissionPersistence, mission: GrowthMission): Promise<GrowthMission> {
  if (mission.status !== "draft") throw new Error("Only draft missions may enter draft persistence");
  await store.saveMission(mission);
  await store.saveActions(mission.id, mission.actions);
  return mission;
}

export async function requestMissionApproval(store: MissionPersistence, missionId: string): Promise<GrowthMission> {
  const record = await store.getMission(missionId);
  if (!record) throw new Error(`Mission ${missionId} not found`);
  const mission = transitionMission(record.mission, "SUBMIT_FOR_APPROVAL");
  await store.saveMission(mission);
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
  const measuring = transitionMission(record.mission, "START_MEASUREMENT");
  await store.saveMission(measuring);
  const outcome = recordMissionOutcome({ mission: measuring, metrics, confidence, evidence });
  await store.saveOutcome(outcome);
  await store.saveMission(transitionMission(measuring, "COMPLETE"));
  return outcome;
}

export async function replaceMissionActions(
  store: MissionPersistence,
  missionId: string,
  actions: readonly GrowthAction[],
): Promise<GrowthMission> {
  const record = await store.getMission(missionId);
  if (!record) throw new Error(`Mission ${missionId} not found`);
  if (record.mission.status !== "draft" && record.mission.status !== "awaiting_approval") {
    throw new Error("Mission actions are immutable after approval");
  }
  await store.saveActions(missionId, actions);
  return { ...record.mission, actions: [...actions] };
}
