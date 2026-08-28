import type { GrowthAction, GrowthMission } from "./growthTypes";
import type { CapabilityRegistry } from "./capabilityRegistry";
import type { ExecutionLedger } from "./executionIdempotency";
import { InMemoryJobQueue, runExecutionJob, type ExecutionJob } from "./jobQueue";
import type { GrowthEventStore } from "./growthEventStore";
import type { AgentTelemetry } from "./agentTelemetry";
import { emitExecutionEvent } from "./executionEvents";

export type OrchestrationResult = {
  completed: ExecutionJob[];
  failed: ExecutionJob[];
  skipped: ExecutionJob[];
};

export async function orchestrateApprovedMission(
  mission: GrowthMission,
  actions: readonly GrowthAction[],
  capabilityFor: (action: GrowthAction) => string | undefined,
  registry: CapabilityRegistry,
  ledger: ExecutionLedger,
  queue: InMemoryJobQueue,
  events?: GrowthEventStore,
  telemetry?: AgentTelemetry,
): Promise<OrchestrationResult> {
  if (mission.status !== "approved") throw new Error("Only approved missions enter orchestration");

  const jobs: ExecutionJob[] = [];
  for (const action of actions) {
    const capabilityId = capabilityFor(action);
    if (!capabilityId || !registry.get(capabilityId)) continue;
    const job: ExecutionJob = { id: crypto.randomUUID(), missionId: mission.id, actionId: action.id, capabilityId, attempts: 0, maxAttempts: 3, status: "queued" };
    queue.enqueue(job);
    jobs.push(job);
  }

  const completed: ExecutionJob[] = [];
  const failed: ExecutionJob[] = [];
  const skipped: ExecutionJob[] = [];
  for (const job of jobs) {
    const action = actions.find((item) => item.id === job.actionId);
    if (!action) { skipped.push({ ...job, status: "failed" }); continue; }
    const result = await runExecutionJob(job, mission, action, registry, ledger);
    if (result.job.status === "completed") completed.push(result.job);
    else failed.push(result.job);
    if (events && telemetry) {
      await emitExecutionEvent(events, telemetry, {
        missionId: mission.id,
        type: result.job.status === "completed" ? "mission.executing" : "mission.cancelled",
        actor: "system",
        metadata: { actionId: action.id, jobId: job.id, result: result.result },
      });
    }
  }

  return { completed, failed, skipped };
}
