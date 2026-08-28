# Vertical Growth Engine Architecture

## Product thesis

GGA is the first vertical implementation of a reusable Growth Advisor Engine. Gastro is the initial domain pack, not the architectural boundary.

## Core engine

The platform owns the reusable control plane:

- tenant and identity boundaries
- business profile and goals
- AI control plane
- adaptive model routing
- diagnosis
- opportunity scoring
- mission generation
- action generation
- approval workflow
- governed execution
- measurement
- learning and outcome telemetry
- entitlements and billing
- auditability

## Vertical domain pack

Each vertical supplies configuration and domain knowledge rather than a second application codebase.

```text
VerticalPack
  id
  displayName
  locale
  terminology
  kpis
  diagnosisRules
  opportunityTaxonomy
  missionTemplates
  actionTemplates
  integrations
  benchmarkSources
  pricingProfile
  visualTheme
```

Initial candidates:

1. restaurant
2. beauty
3. barber
4. hairdresser
5. fitness
6. hotel
7. home_services
8. construction
9. property_management
10. dental

## Data model direction

Business records should carry an explicit vertical identifier. AI context should be assembled from:

```text
GLOBAL GROWTH LOGIC
+
VERTICAL PACK
+
BUSINESS PROFILE
+
LIVE BUSINESS DATA
+
CURRENT GOAL
+
HISTORICAL OUTCOMES
```

Never train or infer from cross-tenant private data without an explicit aggregation, privacy, and governance layer.

## Product strategy

Do not launch ten verticals simultaneously.

Sequence:

```text
Gastro
  -> prove activation and ROI
  -> collect outcome data
  -> harden engine
  -> launch second adjacent vertical
  -> reuse engine
  -> expand vertical portfolio
```

The first expansion candidates should have similar customer journeys and measurable outcomes. Beauty, barber, and hairdresser are strong adjacency candidates because booking, retention, reviews, rebooking, upsell, and local demand share structural similarities with hospitality.

## Defensibility

The durable asset is not access to a foundation model. It is the combination of:

- structured vertical data
- domain rules
- customer-specific context
- workflow state
- permissioned execution
- outcome history
- integrations
- repeatable mission and action patterns

The target flywheel is:

```text
CUSTOMER DATA
 -> DIAGNOSIS
 -> ACTION
 -> OUTCOME
 -> LEARNING
 -> BETTER RECOMMENDATION
 -> BETTER CUSTOMER RESULT
 -> MORE DATA
```

## Architecture rule

The frontend brand and copy should feel vertical. The backend engine should remain reusable.

Example:

```text
Gastro Growth Advisor
  = Growth Engine + Restaurant Pack

Barber Growth Advisor
  = Growth Engine + Barber Pack

Hotel Growth Advisor
  = Growth Engine + Hotel Pack
```

This preserves a single engineering core while allowing focused landing pages, terminology, KPIs, workflows, pricing, and onboarding per market.
