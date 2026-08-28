export type RetryDecision = {
  retry: boolean;
  attempt: number;
  maxAttempts: number;
  delayMs: number;
  reason: string;
};

export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
};

export function classifyRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return ["timeout", "timed out", "rate limit", "429", "502", "503", "504", "network", "temporarily unavailable"].some((signal) => message.includes(signal));
}

export function decideRetry(attempt: number, error: unknown, policy: RetryPolicy = DEFAULT_RETRY_POLICY): RetryDecision {
  const retryable = classifyRetryableError(error);
  const retry = retryable && attempt < policy.maxAttempts;
  const delayMs = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  return {
    retry,
    attempt,
    maxAttempts: policy.maxAttempts,
    delayMs,
    reason: retry ? "Transient failure, retry permitted" : retryable ? "Retry limit reached" : "Permanent failure, do not retry",
  };
}
