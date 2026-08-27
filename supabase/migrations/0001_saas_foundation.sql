create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'manager', 'staff', 'marketing', 'analyst', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  website text,
  phone text,
  email text,
  address_line1 text,
  city text,
  postal_code text,
  country text,
  cuisine text,
  price_segment text,
  seats integer check (seats is null or seats >= 0),
  average_ticket numeric(12,2) check (average_ticket is null or average_ticket >= 0),
  target_customer text,
  business_goals jsonb not null default '[]'::jsonb,
  current_problems jsonb not null default '[]'::jsonb,
  opening_hours jsonb not null default '{}'::jsonb,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_progress (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  current_step integer not null default 1 check (current_step between 1 and 9),
  completed_steps integer[] not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists restaurants_organization_idx on public.restaurants(organization_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org and user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.restaurants enable row level security;
alter table public.onboarding_progress enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations
for select using (public.is_org_member(id));

drop policy if exists organizations_insert_owner on public.organizations;
create policy organizations_insert_owner on public.organizations
for insert with check (owner_id = auth.uid());

drop policy if exists organization_members_select_member on public.organization_members;
create policy organization_members_select_member on public.organization_members
for select using (public.is_org_member(organization_id));

drop policy if exists organization_members_insert_self_owner on public.organization_members;
create policy organization_members_insert_self_owner on public.organization_members
for insert with check (user_id = auth.uid());

drop policy if exists restaurants_select_member on public.restaurants;
create policy restaurants_select_member on public.restaurants
for select using (public.is_org_member(organization_id));

drop policy if exists restaurants_insert_member on public.restaurants;
create policy restaurants_insert_member on public.restaurants
for insert with check (public.is_org_member(organization_id));

drop policy if exists restaurants_update_member on public.restaurants;
create policy restaurants_update_member on public.restaurants
for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists restaurants_delete_member on public.restaurants;
create policy restaurants_delete_member on public.restaurants
for delete using (public.is_org_member(organization_id));

drop policy if exists onboarding_select_member on public.onboarding_progress;
create policy onboarding_select_member on public.onboarding_progress
for select using (exists (select 1 from public.restaurants r where r.id = restaurant_id and public.is_org_member(r.organization_id)));

drop policy if exists onboarding_insert_member on public.onboarding_progress;
create policy onboarding_insert_member on public.onboarding_progress
for insert with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and public.is_org_member(r.organization_id)));

drop policy if exists onboarding_update_member on public.onboarding_progress;
create policy onboarding_update_member on public.onboarding_progress
for update using (exists (select 1 from public.restaurants r where r.id = restaurant_id and public.is_org_member(r.organization_id)))
with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and public.is_org_member(r.organization_id)));
