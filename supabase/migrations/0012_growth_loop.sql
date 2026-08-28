create table if not exists public.growth_action_events (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.growth_actions(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  event_type text not null check (event_type in ('proposed','approved','started','completed','failed','measured','rejected')),
  metric_name text,
  metric_before numeric,
  metric_after numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists growth_action_events_action_idx on public.growth_action_events(action_id, created_at desc);
create index if not exists growth_action_events_restaurant_idx on public.growth_action_events(restaurant_id, created_at desc);

alter table public.growth_action_events enable row level security;

create policy "action event members access" on public.growth_action_events
for all using (
  exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = growth_action_events.restaurant_id and om.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = growth_action_events.restaurant_id and om.user_id = auth.uid()
  )
);

alter table public.growth_missions add column if not exists source_analysis_id uuid references public.ai_analyses(id) on delete set null;
create index if not exists growth_missions_source_analysis_idx on public.growth_missions(source_analysis_id);
