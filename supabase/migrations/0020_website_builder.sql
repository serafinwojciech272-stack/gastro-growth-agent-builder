create table if not exists public.website_builder_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  source_url text not null check (char_length(source_url) between 8 and 500),
  vertical text not null check (char_length(vertical) between 1 and 120),
  goal text not null default '' check (char_length(goal) <= 1000),
  status text not null default 'draft' check (status in ('draft','running','ready','blocked','published')),
  active_stage integer not null default 0 check (active_stage between 0 and 10),
  completed_stages integer[] not null default '{}',
  artifacts jsonb not null default '{}'::jsonb,
  source_snapshot jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_builder_projects_org_idx on public.website_builder_projects(organization_id);
create index if not exists website_builder_projects_user_idx on public.website_builder_projects(user_id);
create index if not exists website_builder_projects_updated_idx on public.website_builder_projects(updated_at desc);

alter table public.website_builder_projects enable row level security;

drop policy if exists website_builder_projects_select_member on public.website_builder_projects;
create policy website_builder_projects_select_member on public.website_builder_projects
for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists website_builder_projects_insert_member on public.website_builder_projects;
create policy website_builder_projects_insert_member on public.website_builder_projects
for insert to authenticated
with check (public.is_org_member(organization_id) and user_id = auth.uid());

drop policy if exists website_builder_projects_update_member on public.website_builder_projects;
create policy website_builder_projects_update_member on public.website_builder_projects
for update to authenticated
using (public.is_org_member(organization_id))
with check (public.is_org_member(organization_id));

drop policy if exists website_builder_projects_delete_member on public.website_builder_projects;
create policy website_builder_projects_delete_member on public.website_builder_projects
for delete to authenticated using (public.is_org_member(organization_id));

create or replace function public.touch_website_builder_projects_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists website_builder_projects_updated_at on public.website_builder_projects;
create trigger website_builder_projects_updated_at
before update on public.website_builder_projects
for each row execute function public.touch_website_builder_projects_updated_at();
