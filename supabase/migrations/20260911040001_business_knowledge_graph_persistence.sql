-- Universal Business Knowledge Graph persistence.
-- Canonical tenant identity: public.business_profiles.
-- Business profiles are organization-owned; workspace remains optional metadata.

create table if not exists public.business_entities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  entity_type text not null,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  source text,
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  observed_at timestamptz not null default now(),
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_relationships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  from_entity_id uuid not null references public.business_entities(id) on delete cascade,
  to_entity_id uuid not null references public.business_entities(id) on delete cascade,
  relationship_type text not null,
  attributes jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  source text,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_signals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  signal_type text not null,
  source text not null,
  metric text,
  value jsonb,
  baseline numeric,
  deviation numeric,
  direction text not null default 'unknown',
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  context jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  entity_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_evidence (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  evidence_type text not null,
  source text not null,
  observation text not null,
  data jsonb,
  supporting_signal_ids uuid[] not null default '{}',
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  contradiction boolean not null default false,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_entities_business_id_idx on public.business_entities(business_id);
create index if not exists business_entities_type_idx on public.business_entities(business_id, entity_type);
create index if not exists business_relationships_business_id_idx on public.business_relationships(business_id);
create index if not exists business_relationships_from_idx on public.business_relationships(from_entity_id);
create index if not exists business_relationships_to_idx on public.business_relationships(to_entity_id);
create index if not exists business_signals_business_id_idx on public.business_signals(business_id);
create index if not exists business_signals_observed_at_idx on public.business_signals(business_id, observed_at desc);
create index if not exists business_evidence_business_id_idx on public.business_evidence(business_id);
create index if not exists business_evidence_observed_at_idx on public.business_evidence(business_id, observed_at desc);

alter table public.business_entities enable row level security;
alter table public.business_relationships enable row level security;
alter table public.business_signals enable row level security;
alter table public.business_evidence enable row level security;

create policy business_entities_select on public.business_entities for select using (
  exists (select 1 from public.business_profiles bp where bp.id = business_entities.business_id and public.is_org_member(bp.organization_id))
);
create policy business_entities_insert on public.business_entities for insert with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_entities.business_id and public.is_org_member(bp.organization_id))
);
create policy business_entities_update on public.business_entities for update using (
  exists (select 1 from public.business_profiles bp where bp.id = business_entities.business_id and public.is_org_member(bp.organization_id))
) with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_entities.business_id and public.is_org_member(bp.organization_id))
);
create policy business_entities_delete on public.business_entities for delete using (
  exists (select 1 from public.business_profiles bp where bp.id = business_entities.business_id and public.is_org_member(bp.organization_id))
);

create policy business_relationships_select on public.business_relationships for select using (
  exists (select 1 from public.business_profiles bp where bp.id = business_relationships.business_id and public.is_org_member(bp.organization_id))
);
create policy business_relationships_insert on public.business_relationships for insert with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_relationships.business_id and public.is_org_member(bp.organization_id))
);
create policy business_relationships_update on public.business_relationships for update using (
  exists (select 1 from public.business_profiles bp where bp.id = business_relationships.business_id and public.is_org_member(bp.organization_id))
) with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_relationships.business_id and public.is_org_member(bp.organization_id))
);
create policy business_relationships_delete on public.business_relationships for delete using (
  exists (select 1 from public.business_profiles bp where bp.id = business_relationships.business_id and public.is_org_member(bp.organization_id))
);

create policy business_signals_select on public.business_signals for select using (
  exists (select 1 from public.business_profiles bp where bp.id = business_signals.business_id and public.is_org_member(bp.organization_id))
);
create policy business_signals_insert on public.business_signals for insert with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_signals.business_id and public.is_org_member(bp.organization_id))
);
create policy business_signals_update on public.business_signals for update using (
  exists (select 1 from public.business_profiles bp where bp.id = business_signals.business_id and public.is_org_member(bp.organization_id))
) with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_signals.business_id and public.is_org_member(bp.organization_id))
);
create policy business_signals_delete on public.business_signals for delete using (
  exists (select 1 from public.business_profiles bp where bp.id = business_signals.business_id and public.is_org_member(bp.organization_id))
);

create policy business_evidence_select on public.business_evidence for select using (
  exists (select 1 from public.business_profiles bp where bp.id = business_evidence.business_id and public.is_org_member(bp.organization_id))
);
create policy business_evidence_insert on public.business_evidence for insert with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_evidence.business_id and public.is_org_member(bp.organization_id))
);
create policy business_evidence_update on public.business_evidence for update using (
  exists (select 1 from public.business_profiles bp where bp.id = business_evidence.business_id and public.is_org_member(bp.organization_id))
) with check (
  exists (select 1 from public.business_profiles bp where bp.id = business_evidence.business_id and public.is_org_member(bp.organization_id))
);
create policy business_evidence_delete on public.business_evidence for delete using (
  exists (select 1 from public.business_profiles bp where bp.id = business_evidence.business_id and public.is_org_member(bp.organization_id))
);

create or replace function public.validate_business_relationship_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.business_entities e
    where e.id = new.from_entity_id and e.business_id = new.business_id
  ) then
    raise exception 'from_entity_id does not belong to business_id';
  end if;
  if not exists (
    select 1 from public.business_entities e
    where e.id = new.to_entity_id and e.business_id = new.business_id
  ) then
    raise exception 'to_entity_id does not belong to business_id';
  end if;
  return new;
end;
$$;

create trigger business_relationship_scope_trigger
before insert or update on public.business_relationships
for each row execute function public.validate_business_relationship_scope();
