create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  source text not null default 'manual',
  external_id text,
  rating integer check (rating between 1 and 5),
  author_name text,
  review_text text not null,
  review_date timestamptz,
  sentiment text,
  topics jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.review_analyses (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  summary text,
  sentiment_breakdown jsonb not null default '{}'::jsonb,
  recurring_issues jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  raw_result jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
alter table public.review_analyses enable row level security;

create policy "reviews members can read"
  on public.reviews for select
  using (exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = reviews.restaurant_id and om.user_id = auth.uid()
  ));

create policy "reviews members can insert"
  on public.reviews for insert
  with check (exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = reviews.restaurant_id and om.user_id = auth.uid()
  ));

create policy "reviews members can update"
  on public.reviews for update
  using (exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = reviews.restaurant_id and om.user_id = auth.uid()
  ));

create policy "reviews members can delete"
  on public.reviews for delete
  using (exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = reviews.restaurant_id and om.user_id = auth.uid()
  ));

create policy "review analyses members can read"
  on public.review_analyses for select
  using (exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = review_analyses.restaurant_id and om.user_id = auth.uid()
  ));

create policy "review analyses members can insert"
  on public.review_analyses for insert
  with check (exists (
    select 1 from public.restaurants r
    join public.organization_members om on om.organization_id = r.organization_id
    where r.id = review_analyses.restaurant_id and om.user_id = auth.uid()
  ));

create index if not exists reviews_restaurant_id_idx on public.reviews(restaurant_id);
create index if not exists review_analyses_restaurant_id_idx on public.review_analyses(restaurant_id);
