# GA Universal Business Operating System Blueprint

Status: ACTIVE ARCHITECTURAL NORTH STAR
Version: 1.0.0
Updated: 2026-09-11

## 1. Mission

GA evolves from a gastro-first growth advisor into a Universal Business Operating System. Gastro remains a vertical pack, not the core architecture.

The system's primary job is to turn business reality into measurable, governed action:

BUSINESS → KNOWLEDGE → SIGNAL → EVIDENCE → DIAGNOSIS → OPPORTUNITY → RECOMMENDATION → PRIORITY → MISSION → ACTION → APPROVAL → EXECUTION → MEASUREMENT → OUTCOME → LEARNING

## 2. Architectural invariants

1. There is exactly one Mission/Control/Execution architecture. Do not create a parallel Mission Engine.
2. Universal Core owns business reasoning contracts; vertical packs configure terminology, KPIs, rules, templates, integrations and UX.
3. Business is the durable tenant-scoped subject of intelligence.
4. Organization is the security and membership boundary. Workspace is the operating context when/where introduced; it must not weaken organization isolation.
5. Every persistent intelligence record must be traceable to a business and an authorized organization boundary.
6. AI output is advisory data until it passes validation, policy, approval and execution controls appropriate to risk.
7. Evidence must be distinguishable from inference. Diagnosis must cite evidence/signals.
8. Priority scoring is versioned policy, never an unexplained magic number.
9. Agent Memory and Business Learning are separate concepts.
10. Existing working domain infrastructure is extended incrementally; no mechanical repo-wide refactor.
11. No persistence migration is created until tenant boundaries and RLS are verified.
12. Every stage ends with verification before the next stage is started.

## 3. Current foundation

Strong existing assets include agent control-plane/loop/guardrail infrastructure, action builder, vertical configuration, growth decision infrastructure, mission/outcome structures, Website Builder foundations, CI and Browser QA.

The current implementation therefore requires an intelligence-layer buildout, not a rewrite.

## 4. Target core domains

### Business
Identity, industry, business model, locations, products, services, customer segments, competitors, brand, goals, constraints and history.

### Knowledge
Typed business entities, relationships, facts and contextual state.

### Signals
Normalized observations from analytics, reviews, website, ads, SEO, operations and other sources.

### Evidence
Source-backed observations with confidence, provenance, supporting signals and contradiction state.

### Diagnosis
Problem statement, symptoms, root-cause hypotheses, impact, confidence and supporting evidence.

### Opportunity
A business opportunity derived from diagnosis, with impact, urgency, confidence, effort, cost, risk, strategic value, expected outcome and dependencies.

### Recommendation
A policy-aware proposed solution containing rationale, expected outcome, actions and evidence references.

### Priority
Versioned scoring policy combining impact, urgency, confidence, expected value, effort, cost, risk, strategic value and time-to-result.

### Mission / Action / Approval / Execution
Reuse existing infrastructure. The Universal Core feeds it; it remains the system of execution.

### Measurement / Outcome / Learning
Every executed mission should produce measurable outcome data and structured learning that can influence future diagnosis and recommendations.

## 5. Vertical architecture

Universal Core + Vertical Pack + Business Context + Live Data + Goals + Historical Outcomes.

Vertical packs are configuration/domain adapters, not independent brains. Existing gastro capabilities become the first vertical implementation and proving ground.

## 6. Website Builder position

Website Vision is a capability of Website Builder, not a separate product. Website Builder should eventually consume the same Business Context, Evidence, Diagnosis, Recommendation and Mission infrastructure as other growth capabilities.

Target flow:

URL → Website Audit → Trust Gate → Demo Plan → Growth Decision → Growth Mission → Awaiting Approval → Approval → Execution → Measurement → Learning

## 7. Strategic sequence

### P0 — Intelligence spine
P0.1 Business Domain Model
P0.2 Business Context Contract
P0.3 Business Knowledge Graph
P0.4 Universal Signal Contract
P0.5 Evidence Contract
P0.6 Diagnosis Contract
P0.7 Opportunity Contract
P0.8 Recommendation Contract
P0.9 Priority Engine
P0.10 Persistence + RLS verification

### P1 — Engines and integrations
P1.1 Universal Diagnostic Engine
P1.2 Recommendation Engine
P1.3 Mission Core integration
P1.4 Measurement Engine
P1.5 Business Memory
P1.6 Learning Engine
P1.7 Tool Registry
P1.8 Website Builder persistence
P1.9 Website Builder stage runner
P1.10 SEO Intelligence
P1.11 Google Ads Intelligence
P1.12 Review Intelligence
P1.13 Competitor Intelligence
P1.14 Evaluation Framework

### P2 — Full business intelligence
Offer, Pricing, Sales, Customer, Operations, Financial Intelligence; Mentor, Startup and Rescue modes; Continuous Monitoring; Controlled Autonomy.

### P3 — Advanced autonomy and optimization
Advanced industry packs, autonomous campaign/SEO/website operations, advanced financial scenarios, cross-domain optimization and multi-agent strategy orchestration.

## 8. Master stage sequence

1. Architecture Freeze
2. Business Domain
3. Business Knowledge Graph
4. Signals + Evidence
5. Diagnostic Engine
6. Opportunity Engine
7. Recommendation Engine
8. Priority Engine
9. Mission Integration
10. Measurement
11. Outcome
12. Learning
13. Website Factory
14. SEO OS
15. Google Ads OS
16. Review + Competitor Intelligence
17. Marketing OS
18. Business Operations
19. Business Advisor
20. Industry Expansion
21. Continuous Intelligence
22. Controlled Autonomy

## 9. Long-session engineering protocol

For every long implementation session:

1. Read the current repo state before editing.
2. Establish the exact architectural objective and invariants.
3. Inspect existing implementations for duplication before creating new abstractions.
4. Make the smallest additive change that advances the current stage.
5. Never silently replace an existing working engine with a parallel implementation.
6. Verify types, imports, contracts and persistence boundaries after each logical change.
7. For database work, inspect the live schema, foreign keys, functions and RLS before DDL.
8. For autonomous execution, preserve approval, policy, risk and audit boundaries.
9. Run or inspect available CI/quality evidence before declaring a stage green.
10. Record blockers explicitly instead of working around them with speculative architecture.
11. Commit coherent milestones with descriptive messages.
12. Do not claim deployment or CI success without actual evidence.

## 10. Definition of Done for a stage

A stage is DONE only when:
- the intended contract or behavior exists;
- no conflicting duplicate abstraction was introduced;
- tenant/security boundaries are preserved;
- TypeScript/build/lint or applicable tests are verified;
- integration points are identified and compatible;
- relevant documentation is updated;
- commit exists on the intended branch;
- CI/deployment status is checked when available;
- remaining limitations are explicitly recorded.

## 11. Immediate execution gate

The current active gate is P0.10. Live Supabase inspection must precede Business Graph persistence. The next migration must extend the existing organization/restaurant/business model deliberately rather than creating an isolated second tenancy model.
