create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  source_type text not null check (source_type in ('advisor','menu','reviews','marketing','competitor','seo','analytics')),
  source_id uuid,
  title text not null,
  problem text,
  rationale text,
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  expected_impact text,
  confidence numeric(5,2) check (confidence between 0 and 100),
  action_payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','completed','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  action_type text not null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','awaiting_approval','approved','completed','cancelled')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  due_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recommendations_restaurant_status_idx on public.recommendations(restaurant_id,status);
create index if not exists recommendations_restaurant_priority_idx on public.recommendations(restaurant_id,priority);
create index if not exists actions_restaurant_status_idx on public.actions(restaurant_id,status);
create index if not exists actions_recommendation_idx on public.actions(recommendation_id);

alter table public.recommendations enable row level security;
alter table public.actions enable row level security;

create policy "recommendations members can read" on public.recommendations for select using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=recommendations.restaurant_id and om.user_id=auth.uid()));
create policy "recommendations members can insert" on public.recommendations for insert with check (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=recommendations.restaurant_id and om.user_id=auth.uid()));
create policy "recommendations members can update" on public.recommendations for update using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=recommendations.restaurant_id and om.user_id=auth.uid()));

create policy "actions members can read" on public.actions for select using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=actions.restaurant_id and om.user_id=auth.uid()));
create policy "actions members can insert" on public.actions for insert with check (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=actions.restaurant_id and om.user_id=auth.uid()));
create policy "actions members can update" on public.actions for update using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=actions.restaurant_id and om.user_id=auth.uid()));

create or replace function public.gga_set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;

drop trigger if exists recommendations_updated_at on public.recommendations;
create trigger recommendations_updated_at before update on public.recommendations for each row execute function public.gga_set_updated_at();
drop trigger if exists actions_updated_at on public.actions;
create trigger actions_updated_at before update on public.actions for each row execute function public.gga_set_updated_at();
