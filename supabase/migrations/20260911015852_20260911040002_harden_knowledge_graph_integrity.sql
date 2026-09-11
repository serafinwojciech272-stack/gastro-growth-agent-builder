-- Reproducible copy of live migration version 20260911015852.

create or replace function public.validate_business_signal_entities()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from unnest(coalesce(new.entity_ids, '{}')) as entity_id
    where not exists (select 1 from public.business_entities e where e.id = entity_id and e.business_id = new.business_id)
  ) then raise exception 'business_signals.entity_ids must reference entities from the same business'; end if;
  return new;
end;
$$;

create trigger business_signal_entity_scope_trigger before insert or update on public.business_signals for each row execute function public.validate_business_signal_entities();

create or replace function public.validate_business_evidence_signals()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from unnest(coalesce(new.supporting_signal_ids, '{}')) as signal_id
    where not exists (select 1 from public.business_signals s where s.id = signal_id and s.business_id = new.business_id)
  ) then raise exception 'business_evidence.supporting_signal_ids must reference signals from the same business'; end if;
  return new;
end;
$$;

create trigger business_evidence_signal_scope_trigger before insert or update on public.business_evidence for each row execute function public.validate_business_evidence_signals();

revoke execute on function public.validate_business_relationship_scope() from public, anon, authenticated;
revoke execute on function public.validate_business_signal_entities() from public, anon, authenticated;
revoke execute on function public.validate_business_evidence_signals() from public, anon, authenticated;
grant execute on function public.validate_business_relationship_scope() to service_role;
grant execute on function public.validate_business_signal_entities() to service_role;
grant execute on function public.validate_business_evidence_signals() to service_role;
