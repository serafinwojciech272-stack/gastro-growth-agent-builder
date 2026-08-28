create or replace function public.record_growth_measurement(
  p_action_id uuid,
  p_metric_name text,
  p_metric_before numeric,
  p_metric_after numeric,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_action growth_actions%rowtype;
  v_delta numeric;
  v_direction text;
begin
  select ga.* into v_action
  from growth_actions ga
  join restaurants r on r.id = ga.restaurant_id
  join organization_members om on om.organization_id = r.organization_id
  where ga.id = p_action_id and om.user_id = auth.uid();

  if not found then raise exception 'Action not found or access denied'; end if;
  if p_metric_name is null or length(trim(p_metric_name)) = 0 then raise exception 'Metric name is required'; end if;
  if p_metric_before is null or p_metric_after is null then raise exception 'Before and after values are required'; end if;

  v_delta := p_metric_after - p_metric_before;
  v_direction := case when v_delta > 0 then 'up' when v_delta < 0 then 'down' else 'flat' end;

  insert into growth_action_events (action_id, restaurant_id, event_type, metric_name, metric_before, metric_after, metadata, created_by)
  values (p_action_id, v_action.restaurant_id, 'measured', trim(p_metric_name), p_metric_before, p_metric_after,
          coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('delta', v_delta, 'direction', v_direction), auth.uid());

  return jsonb_build_object('action_id', p_action_id, 'metric', trim(p_metric_name), 'before', p_metric_before, 'after', p_metric_after, 'delta', v_delta, 'direction', v_direction);
end;
$$;

grant execute on function public.record_growth_measurement(uuid,text,numeric,numeric,jsonb) to authenticated;
