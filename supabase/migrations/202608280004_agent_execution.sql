create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  status text not null check (status in ('running','completed','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.growth_execution_jobs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.growth_missions(id) on delete cascade,
  action_id uuid not null references public.growth_actions(id) on delete cascade,
  capability_id text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  attempts smallint not null default 0 check (attempts >= 0),
  max_attempts smallint not null default 3 check (max_attempts between 1 and 10),
  last_error text,
  available_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists growth_execution_jobs_mission_action_unique
  on public.growth_execution_jobs(mission_id, action_id);
create index if not exists growth_execution_jobs_ready_idx
  on public.growth_execution_jobs(status, available_at, created_at);
create index if not exists agent_runs_business_idx
  on public.agent_runs(business_id, started_at desc);

alter table public.agent_runs enable row level security;
alter table public.growth_execution_jobs enable row level security;

create policy "agent runs owner access" on public.agent_runs
for all using (business_id = auth.uid()) with check (business_id = auth.uid());

create policy "execution jobs mission owner access" on public.growth_execution_jobs
for all using (
  exists (select 1 from public.growth_missions m where m.id = mission_id and m.business_id = auth.uid())
)
with check (
  exists (select 1 from public.growth_missions m where m.id = mission_id and m.business_id = auth.uid())
);
