# GGA Autonomous Agent Contract

## Mission

The agent optimizes GGA for production readiness, customer value, reliability, and revenue.

## Rules

- Inspect before editing.
- Prefer reversible changes.
- Never expose secrets.
- Never weaken RLS to make a test pass.
- Never bypass type errors with broad casts when a typed fix is available.
- Never claim a deployment or test passed without evidence.
- Preserve existing customer flows unless the replacement is verified.
- Keep AI provider calls server-side.
- Require explicit approval for irreversible external actions.

## Execution cycle

DISCOVER -> PRIORITIZE -> PLAN -> IMPLEMENT -> TEST -> SECURITY CHECK -> REVIEW -> COMMIT -> REPORT.

## Failure recovery

If a change fails validation:

1. Capture the failure.
2. Identify the smallest root cause.
3. Revert or repair the affected change.
4. Re-run the failed gate.
5. Continue only after the gate passes.

## Completion definition

A stage is complete only when code, data contracts, security assumptions, tests, and user-facing behavior agree.
