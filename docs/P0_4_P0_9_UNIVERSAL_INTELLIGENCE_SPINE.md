# P0.4–P0.9 Universal Intelligence Spine

Status: implementation in progress

The Universal Business OS intelligence path is:

`SIGNAL → EVIDENCE → DIAGNOSIS → OPPORTUNITY → RECOMMENDATION → PRIORITY → MISSION`

## Canonical responsibilities

- **Signal**: a machine-readable change, anomaly, threshold breach, event or feedback observed for a Business.
- **Evidence**: an auditable observation supporting or contradicting a conclusion. Evidence is not silently promoted to fact.
- **Diagnosis**: a traceable explanation of a business problem, linked to signal and evidence IDs.
- **Opportunity**: a quantified opportunity derived from a diagnosis or other valid business context.
- **Recommendation**: an actionable proposal tied to an opportunity and evidence, with an explicit policy version.
- **Priority**: a versioned 0–100 decision score balancing upside against effort, cost, risk and time-to-result.
- **Mission**: the existing Control Plane / Mission Builder execution object. No second mission engine is introduced.

## Tenant invariant

All persisted intelligence is scoped through `business_profiles.organization_id` and the existing `is_org_member()` authorization primitive. Graph relationships, signal entity references and evidence signal references are constrained to the same Business. Intelligence artifacts use the same business scope and preserve cross-artifact foreign-key integrity.

## Runtime boundary

Pure intelligence functions remain deterministic and side-effect free. Persistence is injected through the RLS-protected Supabase client. Service-role-only database functions are used only for server-side integrity triggers; the browser never receives service-role credentials.

## Diagnostic engine

`universalDiagnosticEngine.ts` provides the first universal, evidence-backed diagnostic cycle. It does not invent root causes as facts. Negative/anomalous/threshold signals are converted into measurement evidence, grouped into traceable diagnoses, and converted into quantified opportunities with conservative defaults. Root cause language is explicitly marked for validation until stronger evidence exists.

The engine can therefore operate with real signal producers without requiring a vertical-specific diagnostic engine. Vertical packs may later replace or enrich the scoring and interpretation policy without changing the Universal Business Core contracts.

## Priority invariant

The priority policy weights must sum to 1. Penalty dimensions are transformed into positive utility (`100 - penalty`) before weighting, so the final score is a genuine 0–100 score rather than a capped sub-100 value.

## Mission integration

`buildGrowthMissionFromUniversal()` bridges the canonical Universal Opportunity ranking into the existing Growth Mission Builder and creates missions in `awaiting_approval`. This is an adapter, not a parallel execution engine. Approval, execution, measurement, outcome and learning remain owned by the existing Growth Control Plane.

## Persistence

The live Supabase project contains the canonical `business_profiles` identity plus `business_entities`, `business_relationships`, `business_signals` and `business_evidence`. It also contains `business_diagnoses`, `business_opportunities`, `business_recommendations` and `business_priority_scores`. These intelligence tables are organization-protected through the Business → Organization membership boundary, with cross-artifact foreign keys and business-scope integrity enforced in the database.

The graph and intelligence artifact tables start empty by design. Production truth must be collected from real business data and integrations; no synthetic records are inserted merely to make the dashboard look populated.

## Current gates

1. Universal contracts and persistence schema: implemented.
2. Evidence-backed diagnostic cycle: implemented.
3. Universal Opportunity → existing Mission/Approval bridge: implemented.
4. Real signal/evidence producers from website, reviews, menu, analytics and integrations: next.
5. Durable integration of the intelligence cycle with the live application: next.
6. Measurement and outcome linkage: next.
7. Business Learning and continuous intelligence: next.
8. Quality Gate/CI must be verified after the current batch; no green status is claimed without workflow evidence.

No Vercel production deployment is required for these architecture stages. Deployment remains a batch milestone after code and CI are green.
