create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  goal text,
  audience text,
  offer text,
  channels jsonb not null default '[]'::jsonb,
  budget numeric(12,2),
  status text not null default 'draft' check (status in ('draft','ready','approved','active','paused','completed','cancelled')),
  start_at timestamptz,
  end_at timestamptz,
  kpis jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.social_content (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  platform text not null check (platform in ('instagram','facebook','google_business','tiktok','other')),
  content_type text not null default 'post',
  title text,
  body text not null,
  media_prompt text,
  media_url text,
  status text not null default 'draft' check (status in ('draft','ready','approved','scheduled','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  report_type text not null default 'growth',
  period_start date,
  period_end date,
  title text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  file_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  plan_code text not null default 'starter',
  status text not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_subscription_id)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  event_type text not null,
  units integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected' check (status in ('disconnected','pending','connected','error')),
  external_account_id text,
  scopes jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  connected_by uuid references auth.users(id) on delete set null,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, provider, restaurant_id)
);

create index if not exists marketing_campaigns_restaurant_idx on public.marketing_campaigns(restaurant_id);
create index if not exists social_content_restaurant_idx on public.social_content(restaurant_id);
create index if not exists reports_restaurant_idx on public.reports(restaurant_id);
create index if not exists subscriptions_org_idx on public.subscriptions(organization_id);
create index if not exists usage_events_org_created_idx on public.usage_events(organization_id, created_at desc);
create index if not exists integrations_org_idx on public.integrations(organization_id);

alter table public.marketing_campaigns enable row level security;
alter table public.social_content enable row level security;
alter table public.reports enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;
alter table public.integrations enable row level security;

create policy "campaign members access" on public.marketing_campaigns for all using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=marketing_campaigns.restaurant_id and om.user_id=auth.uid())) with check (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=marketing_campaigns.restaurant_id and om.user_id=auth.uid()));
create policy "social members access" on public.social_content for all using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=social_content.restaurant_id and om.user_id=auth.uid())) with check (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=social_content.restaurant_id and om.user_id=auth.uid()));
create policy "reports members access" on public.reports for all using (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=reports.restaurant_id and om.user_id=auth.uid())) with check (exists (select 1 from public.restaurants r join public.organization_members om on om.organization_id=r.organization_id where r.id=reports.restaurant_id and om.user_id=auth.uid()));
create policy "subscription members read" on public.subscriptions for select using (exists (select 1 from public.organization_members om where om.organization_id=subscriptions.organization_id and om.user_id=auth.uid()));
create policy "usage members read" on public.usage_events for select using (exists (select 1 from public.organization_members om where om.organization_id=usage_events.organization_id and om.user_id=auth.uid()));
create policy "integration members access" on public.integrations for all using (exists (select 1 from public.organization_members om where om.organization_id=integrations.organization_id and om.user_id=auth.uid())) with check (exists (select 1 from public.organization_members om where om.organization_id=integrations.organization_id and om.user_id=auth.uid()));
