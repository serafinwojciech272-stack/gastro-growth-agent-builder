# GGA Autonomy Policy

## Purpose

GGA separates intelligence from execution. The engine may analyze, recommend and prepare work without permission, while external side effects remain controlled by explicit policy.

## Autonomy levels

| Level | Behaviour | Approval |
| --- | --- | --- |
| 0 | Observe and diagnose | No execution |
| 1 | Prepare recommendation or draft | No execution |
| 2 | Prepare executable action | Human approval required |
| 3 | Execute low-risk internal actions | Policy based |
| 4 | Execute approved low-risk external workflows | Policy, limits and audit required |
| 5 | Autonomous growth loop | Only after explicit tenant policy enables it |

## Action policy requirements

Every executable action should declare:

- risk
- autonomy level
- approval requirement
- frequency limit
- budget limit when relevant
- allowed integrations
- rollback strategy when relevant

## Hard boundaries

GGA must not bypass authentication, tenant isolation, RLS, approval requirements, spending limits or integration permissions.

GGA must not claim that an action executed unless execution telemetry confirms it.

GGA must not fabricate business metrics, customer outcomes or benchmark data.

When measurement is insufficient, the outcome must remain `insufficient_data`.

## Execution state machine

`draft -> awaiting_approval -> approved -> executing -> measuring -> completed`

Failure states should preserve the action and error evidence so the next agent cycle can recover instead of silently retrying.

## Product principle

The customer sets the goal and the operating boundaries. GGA handles analysis, planning, preparation, execution within policy, measurement and learning.
