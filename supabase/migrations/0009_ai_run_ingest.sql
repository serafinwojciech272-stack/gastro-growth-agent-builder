create or replace function public.record_ai_run(
  p_restaurant_id uuid,
  p_task text,
  p_model text,
  p_attempts integer default 1,
  p_latency_ms integer default 0,
  p_prompt_tokens integer default null,
  p_completion_tokens integer default null,
  p_total_tokens integer default null,
  p_success boolean default false,
  p_error_code text default null,
  p_quality_score numeric default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_task not in ('advisor','menu','reviews','recommendations','general') then
    raise exception 'invalid AI task';
  end if;

  if p_model is null or length(trim(p_model)) = 0 or length(p_model) > 200 then
    raise exception 'invalid AI model';
  end if;

  if p_restaurant_id is not null and not exists (
    select 1
    from public.restaurants r
    where r.id = p_restaurant_id
      and public.is_org_member(r.organization_id)
  ) then
    raise exception 'restaurant access denied';
  end if;

  if p_attempts < 1 or p_attempts > 5 then
    raise exception 'invalid AI attempts';
  end if;

  if p_latency_ms < 0 or p_latency_ms > 600000 then
    raise exception 'invalid AI latency';
  end if;

  if p_quality_score is not null and (p_quality_score < 0 or p_quality_score > 100) then
    raise exception 'invalid AI quality score';
  end if;

  insert into public.ai_runs (
    restaurant_id,
    user_id,
    task,
    model,
    attempts,
    latency_ms,
    prompt_tokens,
    completion_tokens,
    total_tokens,
    success,
    error_code,
    quality_score,
    metadata
  ) values (
    p_restaurant_id,
    auth.uid(),
    p_task,
    trim(p_model),
    p_attempts,
    p_latency_ms,
    p_prompt_tokens,
    p_completion_tokens,
    p_total_tokens,
    p_success,
    nullif(left(trim(coalesce(p_error_code, '')), 120), ''),
    p_quality_score,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.record_ai_run(uuid,text,text,integer,integer,integer,integer,integer,boolean,text,numeric,jsonb) from public, anon, authenticated;
grant execute on function public.record_ai_run(uuid,text,text,integer,integer,integer,integer,integer,boolean,text,numeric,jsonb) to authenticated;
