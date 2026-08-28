import type { GrowthAction, GrowthMission } from "./growthTypes";
import type { CapabilityRegistry, CapabilityResult } from "./capabilityRegistry";
import type { ExecutionLedger } from "./executionIdempotency";
import { createExecutionKey } from "./executionIdempotency";

export type ExecutionJob = {
  id: string;
  missionId: string;
  actionId: string;
  capabilityId: string;
  attempts: number;
  maxAttempts: number;
  status: "queued" | "running" | "completed" | "failed";
};

export class InMemoryJobQueue {
  private readonly jobs: ExecutionJob[] = [];

  enqueue(job: ExecutionJob): void { this.jobs.push(job); }
  dequeue(): ExecutionJob | undefined { return this.jobs.find((job) => job.status === "queued"); }
  all(): ExecutionJob[] { return [...this.jobs]; }
}

export async function runExecutionJob(
  job: ExecutionJob,
  mission: GrowthMission,
  action: GrowthAction,
  registry: CapabilityRegistry,
  ledger: ExecutionLedger,
): Promise<{ job: ExecutionJob; result: CapabilityResult }> {
  const key = createExecutionKey(mission.id, action.id);
  if (await ledger.has(key)) return { job: { ...job, status: "completed" }, result: { status: "completed", output: { idempotent: true } } };

  let current = { ...job, status: "running" as const };
  let last: CapabilityResult = { status: "failed", error: "Execution failed" };

  for (let attempt = 1; attempt <= Math.max(1, job.maxAttempts); attempt += 1) {
    current = { ...current, attempts: attempt };
    await ledger.markStarted(key);
    last = await registry.execute(job.capabilityId, { mission, action });
    if (last.status === "completed") {
      await ledger.markCompleted(key);
      return { job: { ...current, status: "completed" }, result: last };
    }
  }

  return { job: { ...current, status: "failed" }, result: last };
}
