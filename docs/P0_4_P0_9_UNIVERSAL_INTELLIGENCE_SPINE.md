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

All persisted intelligence is scoped through `business_profiles.organization_id` and the existing `is_org_member()` authorization primitive. Graph relationships, signal entity references and evidence signal references are constrained to the same Business.

## Runtime boundary

Pure intelligence functions remain deterministic and side-effect free. Persistence is injected through the RLS-protected Supabase client. Service-role-only database functions are used only for server-side integrity triggers; the browser never receives service-role credentials.

## Priority invariant

The priority policy weights must sum to 1. Penalty dimensions are transformed into positive utility (`100 - penalty`) before weighting, so the final score is a genuine 0–100 score rather than a capped sub-100 value.

## Mission integration

`buildGrowthMissionFromUniversal()` bridges the canonical Universal Opportunity ranking into the existing Growth Mission Builder. This is an adapter, not a parallel execution engine. Approval, execution, measurement, outcome and learning remain owned by the existing Growth Control Plane.

## Persistence

The live Supabase project contains the canonical `business_profiles` identity plus `business_entities`, `business_relationships`, `business_signals` and `business_evidence`. All five tables have RLS enabled with four CRUD policies. Cross-business validation functions are not executable by `public`, `anon` or `authenticated` roles.

The graph starts empty by design. Production truth must be collected from real business data and integrations; no synthetic intelligence records are inserted merely to make the dashboard look populated.

## Next gates

1. Verify the current Quality Gate after the intelligence changes.
2. Add formal automated unit coverage for the pure intelligence contracts when the repository's test strategy is introduced.
3. Integrate real signal/evidence producers from website, reviews, menu, analytics and integrations.
4. Persist diagnosis/opportunity/recommendation/priority artifacts once their durable schema is designed and tenant/RLS boundaries are verified.
5. Feed the highest-confidence, highest-priority opportunity into the existing Mission/Approval pipeline.
6. Add measurement and outcome linkage, then Business Learning.

No Vercel production deployment is required for these architecture stages. Deployment remains a batch milestone after code and CI are green.
