# GGA Autonomous Productization Roadmap

## Objective

Make Gastro Growth Advisor production-ready for first paying restaurants while maximizing safe automation.

## Operating model

1. Observe repository and production signals.
2. Classify work by business impact and risk.
3. Implement the smallest reversible change.
4. Run lint, typecheck, build, migration checks, and targeted tests.
5. Review security, RLS, secrets, and user-facing failure paths.
6. Commit only verified changes.
7. Measure AI quality, latency, errors, conversion, and activation.
8. Feed measurements back into prioritization.

## Release gates

### Gate A: Engineering integrity
- TypeScript passes.
- ESLint passes.
- Production build passes.
- No client-side AI secrets.
- Supabase migrations are ordered and idempotent.
- RLS policies cover tenant-owned data.

### Gate B: AI integrity
- Every AI task uses the shared control layer.
- Primary and fallback models are configurable.
- Timeouts and provider failures are bounded.
- Structured outputs are validated.
- AI runs record model, latency, token usage, success, and quality.
- Low-quality outputs are rejected or retried.

### Gate C: Customer value
- A restaurant reaches first useful diagnosis after onboarding.
- Diagnosis produces prioritized actions.
- Actions map to measurable business goals.
- The UI clearly communicates what to do next.

### Gate D: Commercial readiness
- Pricing is explicit.
- Subscription state maps to entitlements.
- Trial and upgrade paths are deterministic.
- Usage limits are enforced server-side.
- Billing failures have a recoverable user path.

### Gate E: Launch
- Mobile critical paths pass.
- Auth recovery works.
- Empty, loading, error, and retry states work.
- SEO metadata and social previews exist.
- Production environment variables are documented.
- Smoke test covers signup through first AI result.

## Autonomous priority order

1. Blockers that prevent build or deployment.
2. Security and tenant isolation.
3. Broken end-to-end customer journeys.
4. AI reliability and quality.
5. Activation and first-value experience.
6. Billing and entitlements.
7. Measurement and observability.
8. Performance and mobile UX.
9. Conversion optimization.
10. Non-critical visual polish.

## AI automation target

The long-term loop is:

OBSERVE -> PLAN -> GENERATE -> VALIDATE -> APPROVE -> EXECUTE -> MEASURE -> LEARN.

High-risk external actions require explicit customer approval. Low-risk analysis, drafting, scoring, deduplication, validation, and prioritization should remain automated.
