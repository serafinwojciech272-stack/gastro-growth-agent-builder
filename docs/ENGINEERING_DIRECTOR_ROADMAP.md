# Growth Advisor Engine

## Product architecture

Growth Advisor is a vertical-agnostic growth operating system. Vertical products are configuration and experience layers over one shared engine.

Core loop:
SIGNALS -> DIAGNOSIS -> MISSION -> ACTIONS -> PRIORITY -> QUALITY GATE -> APPROVAL -> EXECUTION -> MEASUREMENT -> LEARNING -> NEXT MISSION

Website loop:
URL -> CRAWL -> CONTENT MODEL -> UX/SEO/CONVERSION AUDIT -> FUTURE CONCEPT -> BUILD PLAN -> COMPONENT GENERATION -> SANDBOX PREVIEW -> QUALITY GATE -> APPROVAL -> DEPLOY -> MEASURE

## Vertical strategy

Initial verticals: restaurant, hotel, barber, hairdresser, beauty, home_services, construction, professional_services.

Each vertical supplies KPI priorities, acquisition channels, conversion levers and proof requirements. Core orchestration remains shared.

## Repository boundaries

Future repositories should separate concerns rather than duplicate vertical applications:

1. growth-advisor-core: domain contracts, mission orchestration, policy, prioritization, measurement and learning.
2. growth-advisor-website-engine: URL ingestion, website analysis, design system generation, preview and build planning.
3. growth-advisor-control-plane: approvals, jobs, telemetry, audit trail, safety policy and recovery.
4. growth-advisor-verticals: reusable vertical definitions and landing-page configurations.
5. growth-advisor-web: customer-facing shell, onboarding, Command Center and vertical experiences.

## Quality bar

Every repository requires strict TypeScript, lint, production build, unit tests for domain logic, deterministic fixtures, secret scanning, dependency review, accessibility checks and mobile-first smoke tests.

No vertical-specific fork should copy orchestration logic. No AI output reaches execution without policy validation and the required approval state.

## Commercial flow

Anonymous visitor -> choose business type -> submit website -> receive future-site preview -> see prioritized growth opportunities -> create account -> connect business data -> approve first mission -> execute -> measure -> learn -> retain.

The website preview is the acquisition wedge. The autonomous growth loop is the retention engine.
