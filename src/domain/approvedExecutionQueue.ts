import type { GrowthMission } from "./growthTypes";
import type { CapabilityRegistry } from "./capabilityRegistry";
import { buildExecutionPlan } from "./executionPlan";
import { InMemoryJobQueue, type ExecutionJob } from "./jobQueue";

export type ApprovedQueueResult = {
  jobs: ExecutionJob[];
  blockedActionIds: string[];
};

export function queueApprovedMission(
  mission: GrowthMission,
  registry: CapabilityRegistry,
  queue: InMemoryJobQueue,
  resolveCapability: (action: GrowthMission["actions"][number]) => string | undefined,
): ApprovedQueueResult {
  if (mission.status !== "approved") throw new Error("Only approved missions enter the execution queue");

  const plan = buildExecutionPlan(mission);
  const jobs: ExecutionJob[] = [];
  const blockedActionIds = plan.blocked.map(({ action }) => action.id);

  for (const action of plan.executable) {
    const capabilityId = resolveCapability(action);
    if (!capabilityId || !registry.get(capabilityId)) {
      blockedActionIds.push(action.id);
      continue;
    }
    const job: ExecutionJob = {
      id: crypto.randomUUID(),
      missionId: mission.id,
      actionId: action.id,
      capabilityId,
      attempts: 0,
      maxAttempts: 3,
      status: "queued",
    };
    queue.enqueue(job);
    jobs.push(job);
  }

  return { jobs, blockedActionIds };
}
