import type { GrowthAction, GrowthMission } from "./growthTypes";
import { buildIdempotencyKey, runIdempotent, type IdempotencyStore } from "./idempotency";
import { classifyRetryableError, decideRetry, type RetryPolicy, DEFAULT_RETRY_POLICY } from "./retryPolicy";

export type CoordinatedExecution = {
  actionId: string;
  status: "completed" | "failed";
  attempts: number;
  result?: unknown;
  error?: string;
};

export async function executeActionWithResilience(
  mission: GrowthMission,
  action: GrowthAction,
  store: IdempotencyStore,
  executor: () => Promise<unknown>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): Promise<CoordinatedExecution> {
  const key = buildIdempotencyKey({ businessId: mission.businessId, missionId: mission.id, actionId: action.id });
  let attempts = 0;

  try {
    const result = await runIdempotent(store, key, async () => {
      let lastError: unknown;
      while (attempts < policy.maxAttempts) {
        attempts += 1;
        try {
          return await executor();
        } catch (error) {
          lastError = error;
          const decision = decideRetry(attempts, error, policy);
          if (!decision.retry) throw error;
          await new Promise((resolve) => setTimeout(resolve, decision.delayMs));
        }
      }
      throw lastError ?? new Error("Execution failed without an error");
    });
    return { actionId: action.id, status: "completed", attempts, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { actionId: action.id, status: "failed", attempts, error: message };
  }
}

export function isTransientExecutionFailure(error: unknown): boolean {
  return classifyRetryableError(error);
}
