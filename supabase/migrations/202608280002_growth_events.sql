create table if not exists public.growth_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.growth_missions(id) on delete cascade,
  type text not null,
  actor text not null check (actor in ('system','customer','ai')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists growth_events_mission_idx on public.growth_events(mission_id, created_at desc);

alter table public.growth_events enable row level security;

create policy "growth events mission owner access" on public.growth_events
for all using (
  exists (
    select 1 from public.growth_missions m
    where m.id = mission_id and m.business_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.growth_missions m
    where m.id = mission_id and m.business_id = auth.uid()
  )
);
