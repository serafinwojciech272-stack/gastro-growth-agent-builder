alter table public.growth_missions
  add column if not exists approval_status text not null default 'not_required' check (approval_status in ('not_required','pending','approved','rejected')),
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists execution_started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists last_error text;

create table if not exists public.growth_measurements (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.growth_missions(id) on delete cascade,
  action_id uuid references public.growth_actions(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  kpi text not null,
  baseline numeric,
  before_value numeric,
  after_value numeric,
  target numeric,
  delta numeric generated always as (case when before_value is not null and after_value is not null then after_value - before_value end) stored,
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  evidence jsonb not null default '[]'::jsonb,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.growth_learning_memory (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  mission_id uuid references public.growth_missions(id) on delete set null,
  kpi text not null,
  recommendation text not null,
  confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1),
  sample_size integer not null default 1,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists growth_measurements_mission_idx on public.growth_measurements(mission_id, measured_at desc);
create index if not exists growth_measurements_restaurant_idx on public.growth_measurements(restaurant_id, measured_at desc);
create index if not exists growth_learning_restaurant_idx on public.growth_learning_memory(restaurant_id, created_at desc);

alter table public.growth_measurements enable row level security;
alter table public.growth_learning_memory enable row level security;

create policy "measurement members access" on public.growth_measurements
for all using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id = r.organization_id where r.id = growth_measurements.restaurant_id and om.user_id = auth.uid()))
with check (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id = r.organization_id where r.id = growth_measurements.restaurant_id and om.user_id = auth.uid()));

create policy "learning members access" on public.growth_learning_memory
for all using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id = r.organization_id where r.id = growth_learning_memory.restaurant_id and om.user_id = auth.uid()))
with check (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id = r.organization_id where r.id = growth_learning_memory.restaurant_id and om.user_id = auth.uid()));
