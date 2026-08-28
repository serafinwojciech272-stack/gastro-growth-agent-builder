create table if not exists public.growth_missions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  vertical text not null,
  objective text not null,
  baseline text,
  target text,
  deadline timestamptz,
  expected_impact text,
  confidence numeric(4,3) check (confidence between 0 and 1),
  status text not null default 'draft' check (status in ('draft','awaiting_approval','approved','executing','measuring','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_actions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.growth_missions(id) on delete cascade,
  title text not null,
  description text not null,
  risk text not null check (risk in ('low','medium','high')),
  autonomy_level smallint not null check (autonomy_level between 0 and 5),
  requires_approval boolean not null default true,
  expected_impact text,
  rollback_strategy text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.growth_outcomes (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.growth_missions(id) on delete cascade,
  action_id uuid references public.growth_actions(id) on delete set null,
  status text not null check (status in ('success','partial_success','no_impact','negative','insufficient_data')),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  metrics jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  measured_at timestamptz not null default now()
);

create index if not exists growth_missions_business_idx on public.growth_missions(business_id, created_at desc);
create index if not exists growth_actions_mission_idx on public.growth_actions(mission_id);
create index if not exists growth_outcomes_mission_idx on public.growth_outcomes(mission_id, measured_at desc);

alter table public.growth_missions enable row level security;
alter table public.growth_actions enable row level security;
alter table public.growth_outcomes enable row level security;

create policy "growth missions owner access" on public.growth_missions
for all using (business_id = auth.uid()) with check (business_id = auth.uid());

create policy "growth actions mission owner access" on public.growth_actions
for all using (exists (select 1 from public.growth_missions m where m.id = mission_id and m.business_id = auth.uid()))
with check (exists (select 1 from public.growth_missions m where m.id = mission_id and m.business_id = auth.uid()));

create policy "growth outcomes mission owner access" on public.growth_outcomes
for all using (exists (select 1 from public.growth_missions m where m.id = mission_id and m.business_id = auth.uid()))
with check (exists (select 1 from public.growth_missions m where m.id = mission_id and m.business_id = auth.uid()));
