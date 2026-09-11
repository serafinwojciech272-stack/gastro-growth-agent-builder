create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid null,
  name text not null,
  legal_name text null,
  industry text not null default 'unknown',
  business_model text not null default 'unknown',
  website_url text null,
  locale text null,
  timezone text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profiles_business_model_check check (business_model in ('b2b','b2c','b2b2c','marketplace','subscription','transactional','hybrid','unknown'))
);

create index if not exists business_profiles_organization_id_idx on public.business_profiles(organization_id);
create index if not exists business_profiles_workspace_id_idx on public.business_profiles(workspace_id);

alter table public.business_profiles enable row level security;

create policy business_profiles_select_member on public.business_profiles
  for select to public using (public.is_org_member(organization_id));

create policy business_profiles_insert_member on public.business_profiles
  for insert to public with check (public.is_org_member(organization_id));

create policy business_profiles_update_member on public.business_profiles
  for update to public
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy business_profiles_delete_member on public.business_profiles
  for delete to public using (public.is_org_member(organization_id));

alter table public.businesses
  add column if not exists business_profile_id uuid null references public.business_profiles(id) on delete set null;

alter table public.restaurants
  add column if not exists business_profile_id uuid null references public.business_profiles(id) on delete set null;

create unique index if not exists businesses_business_profile_id_uidx
  on public.businesses(business_profile_id) where business_profile_id is not null;

create unique index if not exists restaurants_business_profile_id_uidx
  on public.restaurants(business_profile_id) where business_profile_id is not null;

insert into public.business_profiles (organization_id, name, industry, business_model, website_url, metadata, created_at, updated_at)
select
  om.organization_id,
  b.name,
  coalesce(nullif(b.cuisine_type, ''), 'unknown'),
  'unknown',
  b.website_url,
  jsonb_build_object('source', 'legacy_businesses', 'legacy_business_id', b.id),
  b.created_at,
  b.updated_at
from public.businesses b
join public.users u on u.id = b.user_id
join public.organization_members om on om.user_id::text = u.supabase_user_id::text
where not exists (
  select 1 from public.business_profiles p
  where p.metadata->>'legacy_business_id' = b.id::text
);

update public.businesses b
set business_profile_id = p.id
from public.business_profiles p
where p.metadata->>'legacy_business_id' = b.id::text
  and b.business_profile_id is null;

create or replace function public.set_business_profile_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists business_profiles_set_updated_at on public.business_profiles;
create trigger business_profiles_set_updated_at
before update on public.business_profiles
for each row execute function public.set_business_profile_updated_at();
