create or replace function public.current_plan_code(p_organization_id uuid)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_plan text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
  ) then
    raise exception 'organization access denied';
  end if;

  select s.plan_code into v_plan
  from public.subscriptions s
  where s.organization_id = p_organization_id
    and s.status in ('trialing','active','past_due')
  order by s.updated_at desc
  limit 1;

  return coalesce(v_plan, 'starter');
end;
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
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_plan text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
  ) then
    raise exception 'organization access denied';
  end if;

  v_plan := public.current_plan_code(p_organization_id);

  return query
  with plan as (
    select pe.* from public.plan_entitlements pe where pe.plan_code = v_plan
  ), usage as (
    select
      count(*) filter (where ue.event_type = 'ai_run')::bigint as ai_runs_used,
      count(*) filter (where ue.event_type = 'content_generated')::bigint as content_used
    from public.usage_events ue
    where ue.organization_id = p_organization_id
      and ue.created_at >= date_trunc('month', now())
  ), missions as (
    select count(*)::bigint as active_missions_used
    from public.growth_missions gm
    join public.restaurants r on r.id = gm.restaurant_id
    where r.organization_id = p_organization_id
      and gm.status = 'active'
  )
  select plan.plan_code, plan.monthly_ai_runs, plan.monthly_content, plan.active_missions,
         plan.features, usage.ai_runs_used, usage.content_used, missions.active_missions_used
  from plan cross join usage cross join missions;
end;
$$;

revoke all on function public.current_plan_code(uuid) from public, anon;
revoke all on function public.get_entitlements(uuid) from public, anon;
grant execute on function public.current_plan_code(uuid) to authenticated;
grant execute on function public.get_entitlements(uuid) to authenticated;
