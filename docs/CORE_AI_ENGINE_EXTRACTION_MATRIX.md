# Core AI Engine Extraction Matrix

Status: ACTIVE
Version: 1.0.0
Updated: 2026-09-15

## Purpose

Define the reusable platform boundary between Growth Advisor as a product experience and the Universal Core AI Engine as reusable technology. This is an architecture boundary, not a repo-wide refactor instruction.

## Product layers

```text
CORE AI ENGINE
  Context → Signal → Evidence → Diagnosis → Opportunity → Recommendation → Priority
  → Mission Adapter → Approval/Policy → Execution → Measurement → Outcome → Learning

DOMAIN / VERTICAL PACK
  terminology, KPI policy, scoring policy, templates, tools, integrations, UX

PRODUCT EXPERIENCE
  Growth Advisor, Extra Szpieg, future vertical applications

INVESTOR / ENTERPRISE EXPERIENCE
  Core Console + Growth Advisor Investor Experience
```

## What belongs in Core

1. Context Contract: canonical business/entity context, goals, constraints, time horizon, operating boundaries and provenance.
2. Signal Contract: normalized observations with source, timestamp, entity scope, signal type, severity and freshness.
3. Evidence Contract: auditable observations supporting or contradicting conclusions, with provenance, confidence and contradiction state.
4. Diagnosis Contract: traceable problem statement, symptoms, hypotheses, impact, confidence and evidence references. Root-cause hypotheses are never silently promoted to facts.
5. Opportunity Contract: quantified opportunity with expected value, urgency, effort, cost, risk, strategic value, dependencies, confidence and evidence references.
6. Recommendation Contract: policy-aware proposed solution with rationale, expected outcome, action candidates and evidence references.
7. Priority Engine: versioned 0–100 scoring policy. The formula and policy version must be inspectable and reproducible.
8. Mission Adapter: Core does not create a second execution architecture. It produces canonical mission intent consumed by the existing Growth Control Plane / Mission Builder.
9. Policy and Autonomy: risk, autonomy level, approval requirement, limits, permitted tools, budget/frequency constraints and rollback metadata.
10. Outcome Contract: baseline, post-action measurements, measurement window, execution evidence, outcome class and confidence.
11. Learning Contract: structured learning from verified outcomes only. Model response quality and business outcome quality remain separate dimensions.
12. Provenance / Audit: important decisions must be reconstructable from context, evidence, policy version, engine version, inputs, outputs and execution telemetry.

## What remains product/domain-specific

- UI and navigation
- Industry terminology
- Industry KPI definitions
- Vertical scoring policies
- Domain-specific data adapters
- Domain-specific tools and integrations
- Domain-specific prompts and templates
- Customer-facing workflows
- Product pricing and packaging

## Existing assets to reuse

The current Growth Advisor repository already contains the Universal Business OS blueprint, Universal Intelligence Spine, autonomy policy, Mission Pipeline, Outcome Intelligence, Business Context / Knowledge Graph work and existing Control Plane / Mission Builder infrastructure. These are source assets for extraction, not reasons to create parallel implementations.

## Hard architectural invariants

1. Exactly one Mission / Control / Execution architecture.
2. Universal Core owns reasoning contracts; vertical packs configure them.
3. Business and organization boundaries remain authoritative for persistence and security.
4. Evidence and inference are always distinguishable.
5. Priority policy is versioned.
6. AI output is advisory until validation, policy and approval requirements are satisfied.
7. No execution claim without telemetry.
8. No fabricated business metrics, customer outcomes or benchmarks.
9. Existing working infrastructure is extended incrementally.
10. No repo-wide mechanical refactor.

## Target reusable runtime

```text
CoreContext
  ↓
Signal Intake
  ↓
Evidence Builder / Validator
  ↓
Diagnosis Engine
  ↓
Opportunity Engine
  ↓
Recommendation Engine
  ↓
Priority / Decision Engine
  ↓
Mission Intent
  ↓
Policy + Approval Gate
  ↓
Existing Execution Control Plane
  ↓
Measurement
  ↓
Outcome Classification
  ↓
Learning / Memory Update
```

## Engine quality requirements

A production-grade Core must expose deterministic calculations where possible, explicit uncertainty and confidence, provenance and evidence lineage, policy/version identifiers, idempotent mission intent generation, safe failure states, replayable decision traces, evaluation datasets and regression tests, tenant isolation at every persisted boundary, tool permissions and autonomy limits, and observability for latency, errors, cost and outcome quality.

## Monetization-ready boundary

The Core should eventually be packageable as:

1. API / SDK platform for developers.
2. Private enterprise deployment.
3. Embedded intelligence layer for vertical software.
4. Managed AI operations platform.

Do not market these as available capabilities until the corresponding runtime, security, documentation and evaluation evidence exists.

## Current extraction decision

Do not copy the entire Growth Advisor repository into a new Core repository yet. First freeze the contracts and identify the minimum reusable modules. Extract incrementally after compatibility tests exist. This prevents two competing cores from emerging.
