create table if not exists public.plan_entitlements (
  plan_code text primary key,
  monthly_ai_runs integer not null check (monthly_ai_runs > 0),
  monthly_content integer not null check (monthly_content > 0),
  active_missions integer not null check (active_missions > 0),
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plan_entitlements (plan_code, monthly_ai_runs, monthly_content, active_missions, features)
values
  ('starter', 100, 30, 3, '{"advisor":true,"menu":true,"reviews":true,"recommendations":true}'::jsonb),
  ('growth', 500, 150, 10, '{"advisor":true,"menu":true,"reviews":true,"recommendations":true,"campaigns":true,"reports":true}'::jsonb),
  ('pro', 2000, 600, 30, '{"advisor":true,"menu":true,"reviews":true,"recommendations":true,"campaigns":true,"reports":true,"automation":true}'::jsonb)
on conflict (plan_code) do update set
  monthly_ai_runs = excluded.monthly_ai_runs,
  monthly_content = excluded.monthly_content,
  active_missions = excluded.active_missions,
  features = excluded.features,
  updated_at = now();

alter table public.plan_entitlements enable row level security;

create policy "plan entitlements readable" on public.plan_entitlements
for select to authenticated using (true);

create or replace function public.current_plan_code(p_organization_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select s.plan_code
      from public.subscriptions s
      where s.organization_id = p_organization_id
        and s.status in ('trialing','active','past_due')
      order by s.updated_at desc
      limit 1
    ),
    'starter'
  );
$$;

create or replace function public.get_entitlements(p_organization_id uuid)
returns table (
  plan_code text,
  monthly_ai_runs integer,
  monthly_content integer,
  active_missions integer,
  features jsonb,
  ai_runs_used bigint,
  content_used bigint,
  active_missions_used bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with plan as (
    select pe.*
    from public.plan_entitlements pe
    where pe.plan_code = public.current_plan_code(p_organization_id)
  ),
  usage as (
    select
      count(*) filter (where ue.event_type = 'ai_run')::bigint as ai_runs_used,
      count(*) filter (where ue.event_type = 'content_generated')::bigint as content_used
    from public.usage_events ue
    where ue.organization_id = p_organization_id
      and ue.created_at >= date_trunc('month', now())
  ),
  missions as (
    select count(*)::bigint as active_missions_used
    from public.growth_missions gm
    join public.restaurants r on r.id = gm.restaurant_id
    where r.organization_id = p_organization_id
      and gm.status = 'active'
  )
  select plan.plan_code, plan.monthly_ai_runs, plan.monthly_content, plan.active_missions,
         plan.features, usage.ai_runs_used, usage.content_used, missions.active_missions_used
  from plan cross join usage cross join missions;
$$;

revoke all on function public.current_plan_code(uuid) from public, anon;
revoke all on function public.get_entitlements(uuid) from public, anon;
grant execute on function public.current_plan_code(uuid) to authenticated;
grant execute on function public.get_entitlements(uuid) to authenticated;
