import type { GrowthAction, GrowthMission } from "./growthTypes";
import type { CapabilityRegistry } from "./capabilityRegistry";
import type { ExecutionLedger } from "./executionIdempotency";
import { InMemoryJobQueue, runExecutionJob, type ExecutionJob } from "./jobQueue";
import type { GrowthEventStore } from "./growthEventStore";
import type { AgentTelemetry } from "./agentTelemetry";
import { emitExecutionEvent } from "./executionEvents";
import { createActionEvent } from "./growthEventLog";

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
    if (!action) { skipped.push(job); continue; }

    if (events && telemetry) await emitExecutionEvent(events, telemetry, createActionEvent(mission.id, action.id, "action.started", { jobId: job.id }));
    const result = await runExecutionJob(job, mission, action, registry, ledger);

    if (result.job.status === "completed") {
      completed.push(result.job);
      if (events && telemetry) await emitExecutionEvent(events, telemetry, createActionEvent(mission.id, action.id, "action.completed", { jobId: job.id, result: result.result }));
    } else {
      failed.push(result.job);
      if (events && telemetry) await emitExecutionEvent(events, telemetry, createActionEvent(mission.id, action.id, "action.failed", { jobId: job.id, attempts: result.job.attempts, error: result.result.error }));
    }
  }

  return { completed, failed, skipped };
}
