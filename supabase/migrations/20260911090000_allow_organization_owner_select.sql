-- Allow a newly created organization owner to read the organization row
-- returned by the onboarding INSERT ... SELECT before membership exists.
-- Tenant isolation is preserved because the predicate is owner_id = auth.uid().
create policy organizations_select_owner on public.organizations
for select using (owner_id = auth.uid());
