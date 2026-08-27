create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  problem text not null,
  diagnosis text not null,
  root_causes jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  created_at timestamptz not null default now()
);

create index if not exists ai_analyses_restaurant_idx on public.ai_analyses(restaurant_id, created_at desc);

alter table public.ai_analyses enable row level security;

drop policy if exists ai_analyses_select_member on public.ai_analyses;
create policy ai_analyses_select_member on public.ai_analyses
for select using (exists (
  select 1 from public.restaurants r
  where r.id = restaurant_id and public.is_org_member(r.organization_id)
));

drop policy if exists ai_analyses_insert_member on public.ai_analyses;
create policy ai_analyses_insert_member on public.ai_analyses
for insert with check (
  user_id = auth.uid() and exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and public.is_org_member(r.organization_id)
  )
);
