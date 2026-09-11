-- Ensure an authenticated user can inspect their own organization membership.
-- This is required for post-login onboarding routing and preserves tenant isolation:
-- users can see only membership rows where user_id = auth.uid().
create policy organization_members_select_own on public.organization_members
for select using (user_id = auth.uid());
