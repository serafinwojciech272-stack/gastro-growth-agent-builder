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

## Canonical architecture

`Context → Signal → Evidence → Diagnosis → Opportunity → Recommendation → Priority → Mission Intent → existing Approval/Execution Control Plane → Measurement → Outcome → Learning`

There is deliberately no second mission state machine.

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
3. define a narrow tool/action permission interface;
4. prove outcome/learning compatibility;
5. add fixture-based evaluation datasets;
6. run the full repository quality gate successfully;
7. only then extract implementation into a standalone package/repository.

## Commercial rule

The Core must not be marketed as production-ready merely because its API boundary exists. Production/commercial readiness requires verified runtime behavior, tenant/security guarantees, evaluation evidence, observability, documentation and versioning.
