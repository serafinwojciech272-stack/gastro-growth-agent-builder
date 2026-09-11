# P0.10 Persistence + RLS Audit

Date: 2026-09-11
Repository: `serafinwojciech272-stack/gastro-growth-agent-builder`
Branch: `main`
Supabase project: `gastro-growth` (`jjybnpoqnyycyrrzbekd`)

## Executive result

**P0.10 AUDIT COMPLETE — PERSISTENCE OF THE NEW BUSINESS KNOWLEDGE GRAPH IS BLOCKED UNTIL TENANCY IS NORMALIZED.**

The live database contains two overlapping business concepts:

- legacy `public.businesses`, keyed to `public.users`;
- newer `public.restaurants`, keyed to `public.organizations`.

The organization model is the stronger multi-tenant boundary and already protects the newer restaurant-centric domain with `is_org_member(...)` RLS policies. The legacy `businesses` table has RLS enabled but no client policy and therefore must not be treated as the universal tenant root.

## 1. Live tenancy model

Current verified relationship:

`auth.users`
→ `public.organization_members`
→ `public.organizations`
→ `public.restaurants`
→ domain data (`menus`, `reviews`, `recommendations`, `actions`, campaigns, integrations, etc.)

The existing `public.businesses` path is different:

`auth.users` / `public.users`
→ `public.businesses`
→ growth/content/generation records

A live test business is linked indirectly to the test organization through `public.users.supabase_user_id`, not by a direct `businesses.organization_id` foreign key.

## 2. Existing organization security

Verified RLS exists on `organizations`, `organization_members`, `restaurants`, and downstream restaurant-scoped tables.

The central helper is:

`public.is_org_member(target_org uuid) returns boolean`

It is `SECURITY DEFINER`, `STABLE`, and uses `search_path = public`. It checks membership through `organization_members` and `auth.uid()`.

This is currently the strongest reusable tenant authorization primitive.

## 3. RLS observations

All inspected public tables report RLS enabled.

However, RLS enabled does not mean client access is correctly configured. Several tables have no policy at all, including the legacy `businesses`, `growth_mission_runs`, `growth_actions`, `growth_outcomes`, `generation_runs`, `content_jobs`, `users`, and other service-oriented tables.

This is not automatically a vulnerability: service-role/server-side workflows can intentionally operate without client policies. It does mean those tables cannot be assumed to be safe for direct browser persistence.

The newer organization-scoped domain uses explicit membership policies and is the preferred pattern for future Universal Core persistence.

## 4. Important schema collision

`public.businesses` already exists, so creating a new `businesses` table for the Universal Business OS is forbidden.

Likewise, `public.restaurants` is a concrete vertical/domain entity and should not be renamed or discarded during P0.

The Universal Core must therefore distinguish:

- `Business` — universal domain contract;
- `Restaurant` — gastro vertical entity / current persisted vertical representation;
- `Organization` — security/tenant boundary;
- `Workspace` — future operating context, if introduced;
- `Business Graph` — universal intelligence layer attached to the canonical business identity.

## 5. Recommended canonical tenancy boundary

Until a deliberate workspace model is introduced:

`Organization → Business → Graph`

with `Workspace` remaining an application context rather than a second security boundary.

If workspaces are introduced later, they must belong to an organization and every workspace-scoped record must still be provably reachable through the user's organization membership.

Recommended future invariant:

`Business.organization_id` is mandatory and references `organizations.id`.

The existing legacy `businesses.user_id` model should be treated as compatibility/legacy data until migrated or adapted.

## 6. Recommended Graph persistence shape

Do not create a second `businesses` table.

Prefer a migration that first establishes a canonical organization-owned business identity, then adds:

- `business_entities`
- `business_relationships`
- `business_signals`
- `business_evidence`

Every graph table should carry `business_id` and have an FK to the canonical business table. RLS should authorize through the business's organization membership, not through arbitrary client-supplied user IDs.

Relationships must be constrained to entities belonging to the same business.

Signals/evidence must be tenant-scoped through the business.

## 7. Required migration sequence

### P0.10-A — tenancy decision
Freeze the canonical hierarchy as:

`Organization → Business → Business Graph`

with optional future:

`Organization → Workspace → Business → Business Graph`

### P0.10-B — compatibility adapter
Map current legacy `public.businesses` and current `public.restaurants` into the Universal `Business` contract without deleting either table.

### P0.10-C — canonical business persistence
Choose one of:

1. add `organization_id` to existing `public.businesses` and evolve it into the canonical universal business table; or
2. introduce a clearly named canonical table such as `business_profiles` / `business_contexts` and explicitly link both legacy business and restaurant records.

Option 1 is simpler if legacy consumers can tolerate the migration. Option 2 is safer if legacy code is heavily coupled to `public.businesses`.

### P0.10-D — graph tables + RLS
Only after the canonical business identity exists.

### P0.10-E — isolation tests
Verify positive and negative cases across two organizations, including SELECT, INSERT, UPDATE and DELETE where applicable.

## 8. Security rules for future migrations

- Never trust a client-provided `organization_id` without membership validation.
- Prefer membership derived through relational joins/RLS.
- Do not use `user_id` as the primary tenant boundary for Universal Core.
- Do not expose service-role operations to the browser.
- Preserve `is_org_member` or replace it only with an equivalently strong, tested primitive.
- Child graph records must not be writable for a business the caller cannot access.
- Avoid RLS policies that permit cross-business access inside one organization unless explicitly required by the product model.
- Add indexes on tenant foreign keys used by RLS predicates.

## 9. Current data snapshot

The active project is `gastro-growth` in `eu-west-1`.

The database currently contains one organization and one legacy business test record. The organization currently has zero restaurant records. This confirms that legacy `businesses` and newer organization-owned `restaurants` are not yet unified by data migration.

## 10. P0.10 verdict

**RED for new Graph persistence.**

**GREEN for architectural direction:** the existing organization membership/RLS model provides a sound security foundation.

**Required before P0.3 database persistence:** select and implement the canonical Business identity boundary, then add graph persistence behind that boundary.

No Knowledge Graph tables were created during this audit.
