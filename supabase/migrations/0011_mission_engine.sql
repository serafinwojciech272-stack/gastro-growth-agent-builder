create table if not exists public.growth_missions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  goal text not null,
  target_value numeric,
  baseline_value numeric,
  unit text,
  status text not null default 'draft' check (status in ('draft','active','paused','completed','cancelled')),
  priority integer not null default 50 check (priority between 0 and 100),
  start_at timestamptz,
  target_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_actions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.growth_missions(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  description text,
  action_type text not null default 'recommendation',
  status text not null default 'proposed' check (status in ('proposed','approved','in_progress','completed','rejected','failed')),
  impact_score integer not null default 50 check (impact_score between 0 and 100),
  effort_score integer not null default 50 check (effort_score between 0 and 100),
  risk_level text not null default 'low' check (risk_level in ('low','medium','high')),
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists growth_missions_restaurant_status_idx on public.growth_missions(restaurant_id, status, priority desc);
create index if not exists growth_actions_mission_status_idx on public.growth_actions(mission_id, status, due_at);
create index if not exists growth_actions_restaurant_idx on public.growth_actions(restaurant_id, status);

alter table public.growth_missions enable row level security;
alter table public.growth_actions enable row level security;

create policy "mission members access" on public.growth_missions
for all using (
  exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = growth_missions.restaurant_id and om.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = growth_missions.restaurant_id and om.user_id = auth.uid()
  )
);

create policy "action members access" on public.growth_actions
for all using (
  exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = growth_actions.restaurant_id and om.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = growth_actions.restaurant_id and om.user_id = auth.uid()
  )
);

create or replace function public.touch_growth_mission_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_growth_action_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

 drop trigger if exists growth_missions_updated_at on public.growth_missions;
create trigger growth_missions_updated_at before update on public.growth_missions for each row execute function public.touch_growth_mission_updated_at();
 drop trigger if exists growth_actions_updated_at on public.growth_actions;
create trigger growth_actions_updated_at before update on public.growth_actions for each row execute function public.touch_growth_action_updated_at();
