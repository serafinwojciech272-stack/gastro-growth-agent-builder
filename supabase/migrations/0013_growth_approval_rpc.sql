create or replace function public.approve_growth_mission(p_mission_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_mission growth_missions%rowtype;
  v_count integer;
begin
  select gm.* into v_mission
  from growth_missions gm
  join restaurants r on r.id = gm.restaurant_id
  join organization_members om on om.organization_id = r.organization_id
  where gm.id = p_mission_id and om.user_id = auth.uid()
  for update;

  if not found then raise exception 'Mission not found or access denied'; end if;
  if v_mission.status not in ('draft','paused') then raise exception 'Mission is not awaiting approval'; end if;

  update growth_missions set status = 'active' where id = p_mission_id;
  update growth_actions set status = 'approved' where mission_id = p_mission_id and status = 'proposed';
  get diagnostics v_count = row_count;

  insert into growth_action_events (action_id, restaurant_id, event_type, metadata, created_by)
  select id, restaurant_id, 'approved', jsonb_build_object('mission_id', p_mission_id), auth.uid()
  from growth_actions where mission_id = p_mission_id and status = 'approved';

  return jsonb_build_object('mission_id', p_mission_id, 'status', 'active', 'approved_actions', v_count);
end;
$$;

grant execute on function public.approve_growth_mission(uuid) to authenticated;
