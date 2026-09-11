# P0.10-D — Business Knowledge Graph Persistence

Date: 2026-09-11

The Universal Business Knowledge Graph now has a production persistence boundary below the canonical `business_profiles` identity.

## Canonical hierarchy

`Organization -> Business Profile -> Knowledge Graph`

Graph tables:

- `business_entities`
- `business_relationships`
- `business_signals`
- `business_evidence`

Every graph row contains `business_id` referencing `business_profiles(id)` with cascade deletion.

## Authorization

All four graph tables have RLS enabled with SELECT/INSERT/UPDATE/DELETE policies derived from `business_profiles.organization_id` and `is_org_member()`.

The client therefore cannot authorize access by supplying an arbitrary organization identifier. Authorization is relationally derived from the canonical Business.

## Integrity invariants

Relationships can only connect entities belonging to the same Business.
Signals can only reference entities belonging to the same Business.
Evidence can only reference signals belonging to the same Business.

The cross-scope checks are enforced by database triggers. Their SECURITY DEFINER functions are not executable by public, anon, or authenticated roles.

## Application mapping

`src/domain/businessKnowledgeGraphPersistence.ts` maps the universal domain contracts to database row shapes without duplicating business-intelligence semantics.

Persistence is intentionally kept separate from the pure in-memory Knowledge Graph implementation.

## Current state

The production graph is empty by design. One canonical `business_profiles` test record exists. No graph data is fabricated during this stage.

## Next

Proceed to P0.4/P0.5 implementation hardening: Signal and Evidence ingestion contracts, then Diagnostic Engine and Opportunity Engine. Only real observations or explicitly marked test fixtures should enter the graph.
