import type { GrowthAction, GrowthDecisionContext, GrowthMission } from "./growthTypes";
import type { MissionPersistence } from "./missionPersistence";
import type { OpportunitySignal } from "./growthDecisionEngine";
import { CapabilityRegistry } from "./capabilityRegistry";
import { autoBuildMissionToExecutionPlan } from "./autoMissionActionPipeline";
import { InMemoryJobQueue, type ExecutionJob } from "./jobQueue";
import { transitionMission } from "./missionStateMachine";
import type { GrowthEventStore } from "./growthEventStore";
import type { AgentTelemetry } from "./agentTelemetry";
import { emitExecutionEvent } from "./executionEvents";
import { createMissionEvent } from "./growthEventLog";

export type CapabilityResolver = (action: GrowthAction) => string | undefined;

export type AutoExecutionPlan = {
  mission: GrowthMission;
  jobs: ExecutionJob[];
  blockedActionIds: string[];
};

export async function autoBuildExecutionQueue(
  context: GrowthDecisionContext,
  signals: readonly OpportunitySignal[],
  actions: readonly GrowthAction[],
  store: MissionPersistence,
  registry: CapabilityRegistry,
  queue: InMemoryJobQueue,
  resolveCapability: CapabilityResolver,
  events?: GrowthEventStore,
  telemetry?: AgentTelemetry,
): Promise<AutoExecutionPlan> {
  const { mission, actionPlan } = await autoBuildMissionToExecutionPlan(context, signals, actions, store, registry);
  const jobs: ExecutionJob[] = [];
  const blockedActionIds: string[] = [];

  for (const action of actionPlan.executionPlan.executable) {
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

  if (events && telemetry) {
    const approvalEvent = createMissionEvent(transitionMission(mission, "SUBMIT_FOR_APPROVAL"), "SUBMIT_FOR_APPROVAL", "system");
    await emitExecutionEvent(events, telemetry, approvalEvent);
  }

  return { mission: transitionMission(mission, "SUBMIT_FOR_APPROVAL"), jobs, blockedActionIds };
}
