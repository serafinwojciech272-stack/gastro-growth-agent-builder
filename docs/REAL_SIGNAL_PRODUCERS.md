# Real Signal Producers

## Purpose

The Universal Business OS receives raw observations through typed signal producers. Producers do not diagnose, rank, create missions, or bypass approval. They normalize source observations into the canonical `BusinessSignal` and `Evidence` contracts.

## Producer boundary

Current producer kinds:

- `website` — Website Intelligence audit scores and detected issues.
- `reviews` — Review Intelligence rating and qualitative themes.
- `menu` — Menu/Product Intelligence performance and assortment gaps.
- `analytics` — Analytics/KPI measurements and baseline deviation.
- `competitor` — Competitor Intelligence pricing and positioning gaps.

The producers are deliberately source-agnostic. A connector, API route, import job, or vertical pack can supply the typed source data without changing the intelligence core.

## Canonical flow

`source data → producer → BusinessSignal + Evidence → Diagnostic Cycle → Opportunity → Priority → Recommendation → existing Mission Builder → awaiting_approval`

Evidence is normalized separately from inference. A producer may report an observation or measurement, but it must not present an inferred root cause as established fact.

## Safety invariants

1. Every signal and evidence record is scoped to one business.
2. Producer output is deduplicated by stable IDs before diagnosis.
3. Diagnostic processing only consumes signals for the requested business.
4. Intelligence trace validation runs before a mission can be generated.
5. A generated mission enters `awaiting_approval`; the producer layer never approves or executes it.
6. Existing Mission/Control Plane/Execution architecture remains the single execution path.

## Current implementation status

The producer contracts and five initial producers are implemented. The orchestration layer connects all five producer families to the existing evidence-backed diagnostic cycle and approval-ready mission bridge.

The next stage is integration with real source adapters: website audit output, review integrations/imports, menu data, analytics/KPI data, and competitor observations. Those adapters should be added incrementally and should reuse these producer contracts rather than introducing parallel intelligence engines.
