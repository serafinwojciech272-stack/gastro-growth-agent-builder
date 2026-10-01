# Core AI Engine Runtime Extraction Map

Status: `EXTRACTION_V1`

This document maps the reusable Core boundary to the existing implementation. It is intentionally implementation-first: no second reasoning or mission engine is permitted.

## Canonical runtime

`src/core/engine.ts`
→ `src/domain/businessIntelligencePipeline.ts`
→ `src/domain/universalBusinessIntelligence.ts`
→ `src/domain/universalBusinessCore.ts`

The Core facade is therefore a stable API boundary over the existing canonical reasoning implementation, not a fork of it.

## Stage ownership

| Core stage | Current implementation | Extraction status |
|---|---|---|
| Context | `universalBusinessCore.ts`, `businessKnowledgeGraph.ts`, `businessProfileAdapter.ts` | Canonical contracts identified |
| Signal | `businessSignalProducers.ts`, `universalBusinessCore.ts` | Canonical contracts identified |
| Evidence | `businessIntelligencePipeline.ts`, `universalBusinessIntelligence.ts` | Exposed through Core facade |
| Diagnosis | `businessIntelligencePipeline.ts`, `universalBusinessIntelligence.ts` | Exposed through Core facade |
| Opportunity | `businessIntelligencePipeline.ts`, `universalBusinessIntelligence.ts` | Exposed through Core facade |
| Recommendation | `businessIntelligencePipeline.ts`, `universalBusinessIntelligence.ts` | Exposed through Core facade |
| Priority | `universalBusinessCore.ts` | Deterministic, versioned policy |
| Mission intent | `core/missionAdapter.ts`, `missionBuilder.ts` | Adapter only |
| Approval | `approvalGate.ts`, `approvalGuard.ts`, `autonomyPolicy.ts` | Remains Control Plane |
| Execution | `agentControlPlane.ts`, `approvedExecutionQueue.ts`, execution pipeline modules | Remains Control Plane |
| Measurement | `outcomeEngine.ts`, `growthWorkflow.ts` | Remains Control Plane |
| Outcome | `outcomeEngine.ts`, `growthTypes.ts` | Existing implementation |
| Learning | `growthTypes.ts`, `businessMemory.ts`, agent memory modules | Existing implementation; future Core extraction target |
| Provenance / audit | trace validation + agent telemetry/observability modules | Partial; next hardening target |

## Hard invariant

There is exactly one mission lifecycle. Core creates a `MissionIntent` and delegates to the existing `autoCreateMission` / mission persistence / approval / state-machine path. Core must never create a parallel mission state machine.

## Extraction order

1. Stabilize contracts and trace types.
2. Stabilize the Core facade around the canonical intelligence pipeline.
3. Add regression tests for deterministic reasoning and policy scoring.
4. Add provenance lineage and replayable decision traces.
5. Extract learning/outcome interfaces behind adapters.
6. Only after compatibility tests pass, move reusable implementation into a dedicated Core package/repository.

## Commercial boundary

The eventual standalone Core package should expose contracts, reasoning orchestration, policy evaluation, trace/provenance, mission intent, outcome and learning interfaces. Domain packs should provide vertical terminology, KPI definitions, scoring configuration, integrations, tools and customer-facing UX.

Do not describe a capability as production-ready or commercially available until its runtime implementation, security boundary, tests and evaluation evidence exist.
