import type { ExecutionJob } from "./jobQueue";

export type Escalation = {
  required: boolean;
  reason: string;
  severity: "info" | "warning" | "critical";
};

export function evaluateFailureEscalation(job: ExecutionJob, error?: string): Escalation {
  if (job.attempts >= job.maxAttempts) {
    return { required: true, reason: `Execution exhausted ${job.maxAttempts} attempts${error ? `: ${error}` : ""}`, severity: "critical" };
  }
  return { required: false, reason: "Retry remains available", severity: "warning" };
}
