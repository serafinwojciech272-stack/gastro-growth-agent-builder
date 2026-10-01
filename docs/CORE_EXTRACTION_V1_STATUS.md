# Core AI Engine Extraction V1 Status

Status: `EXTRACTION_V1_RUNTIME_BOUNDARY`

## What is real now

The reusable Core boundary exists inside the Growth Advisor repository under `src/core/`.

The Core exposes:

- canonical universal business contracts
- reasoning orchestration through the existing intelligence pipeline
- deterministic, versioned priority scoring
- Mission Intent adaptation into the existing mission control plane
- Outcome and Learning adapters
- provenance and evidence lineage
- trace validation and chronological replay primitives
- governed autonomy policy evaluation with explicit allow / approval / block decisions
- a narrow tool/action permission boundary with fail-closed unknown-tool handling

## Canonical architecture

`Context → Signal → Evidence → Diagnosis → Opportunity → Recommendation → Priority → Mission Intent → Policy / Approval → Tool Permission → existing Execution Control Plane → Measurement → Outcome → Learning`

There is deliberately no second mission state machine and no execution side effect in the Core policy or permission layers.

## Governance rules

The Core policy layer is deterministic and versioned. It evaluates:

- autonomy level
- action risk
- irreversible actions
- external side effects
- tool allow/block policy
- approval requirements

The tool permission boundary resolves a registered capability before policy evaluation. Unknown tools fail closed. Runtime credentials, tenant authorization and integration-specific checks remain responsibilities of the execution adapter.

Policy evaluation returns a decision and provenance. It does not execute tools, mutate external systems or bypass the existing approval/control plane.

## Provenance rules

Every trace stage should identify its source and truth status where possible:

- `observed` = directly observed business/system data
- `calculated` = deterministically derived by the engine
- `estimated` = explicitly estimated
- `simulated` = synthetic/demo data
- `future` = planned capability

Observed evidence requires an observation timestamp. Lineage IDs should connect downstream reasoning to upstream signals/evidence.

## Current limitation

The reasoning facade still delegates to Growth Advisor's canonical domain implementation. This is intentional. Moving files into a new repository before compatibility coverage would create a second source of truth and increase regression risk.

## Next extraction gate

Before creating a standalone Core repository:

1. make decision traces replayable without relying on UI state;
2. isolate policy/autonomy evaluation behind Core contracts;
3. define and test a narrow tool/action permission interface;
4. prove outcome/learning compatibility;
5. add fixture-based evaluation datasets;
6. run the full repository quality gate successfully;
7. only then extract implementation into a standalone package/repository.

## Commercial rule

The Core must not be marketed as production-ready merely because its API boundary exists. Production/commercial readiness requires verified runtime behavior, tenant/security guarantees, evaluation evidence, observability, documentation and versioning.
