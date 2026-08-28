create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  task text not null check (task in ('advisor','menu','reviews','recommendations','general')),
  model text not null,
  attempts integer not null default 1 check (attempts >= 1),
  latency_ms integer not null default 0 check (latency_ms >= 0),
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  success boolean not null default false,
  error_code text,
  quality_score numeric(5,2) check (quality_score is null or (quality_score >= 0 and quality_score <= 100)),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_runs_restaurant_idx on public.ai_runs(restaurant_id, created_at desc);
create index if not exists ai_runs_task_model_idx on public.ai_runs(task, model, created_at desc);
create index if not exists ai_runs_success_idx on public.ai_runs(success, created_at desc);

alter table public.ai_runs enable row level security;

drop policy if exists ai_runs_select_member on public.ai_runs;
create policy ai_runs_select_member on public.ai_runs
for select using (
  restaurant_id is null or exists (
    select 1 from public.restaurants r
    where r.id = restaurant_id and public.is_org_member(r.organization_id)
  )
);

revoke insert, update, delete on public.ai_runs from anon, authenticated;
grant select on public.ai_runs to authenticated;
