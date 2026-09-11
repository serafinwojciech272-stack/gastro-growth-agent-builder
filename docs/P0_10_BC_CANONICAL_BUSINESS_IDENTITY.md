# P0.10-B/C — Canonical Business Identity + Compatibility Adapter

Date: 2026-09-11

Status: implemented, live schema applied, graph persistence still intentionally blocked.

## Decision

`public.business_profiles` is the canonical universal Business identity.

Security boundary:

`auth.users -> organization_members -> organizations -> business_profiles -> Business Graph`

`workspace_id` is nullable at the database layer because Workspace is not yet a formal security boundary. The application contract may supply a workspace context when adapting a profile into the universal `Business` contract.

## Compatibility model

Existing vertical/legacy records remain intact:

- `public.businesses` remains legacy-compatible and receives nullable `business_profile_id`.
- `public.restaurants` remains the restaurant vertical entity and receives nullable `business_profile_id`.
- A canonical profile may later be linked to one legacy business and one vertical representation without making either representation the source of truth.

No existing table was renamed or deleted.

## Canonical fields

The profile owns the universal identity and stable business metadata:

- id
- organization_id
- workspace_id (nullable until Workspace is formalized)
- name / legal_name
- industry
- business_model
- website_url
- locale / timezone
- metadata
- created_at / updated_at

## Tenant isolation

All CRUD policies on `business_profiles` authorize through `public.is_org_member(organization_id)`.

The canonical table therefore does not trust a client-supplied user id as the tenant boundary.

The compatibility foreign keys use `ON DELETE SET NULL`; removing a canonical profile cannot delete legacy or vertical business data.

## Initial backfill

Existing legacy businesses that could be unambiguously mapped through:

`businesses.user_id -> users.supabase_user_id -> organization_members.organization_id`

were backfilled into `business_profiles` and linked with `businesses.business_profile_id`.

No restaurant row existed for the inspected snapshot, so no restaurant mapping was fabricated.

## Application adapter

`src/domain/businessProfileAdapter.ts` converts a canonical profile row into the existing universal `Business` contract. It deliberately keeps database transport separate from domain contracts and requires an explicit `workspaceId` application context when the persisted profile has no workspace.

The adapter also reads optional universal context from `metadata` without creating a second business model.

## Next gate

Do not persist Knowledge Graph records yet.

Next:

1. define and migrate `business_entities`, `business_relationships`, `business_signals`, and `business_evidence`;
2. authorize every graph row through its canonical `business_id -> business_profiles.organization_id` boundary;
3. enforce same-business relationship endpoints;
4. add positive/negative tenant isolation tests;
5. only then wire the Knowledge Graph persistence adapter into the existing intelligence spine.
