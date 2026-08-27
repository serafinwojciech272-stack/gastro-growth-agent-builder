create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null default 'Main Menu',
  source_type text not null default 'manual' check (source_type in ('manual','upload','url')),
  raw_text text not null default '',
  status text not null default 'draft' check (status in ('draft','analyzing','analyzed','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  category text not null default 'Other',
  name text not null,
  description text,
  price numeric(12,2),
  cost numeric(12,2),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_analyses (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer check (score is null or (score between 0 and 100)),
  summary text not null default '',
  strengths jsonb not null default '[]'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists menus_restaurant_idx on public.menus(restaurant_id);
create index if not exists menu_items_menu_idx on public.menu_items(menu_id);
create index if not exists menu_analyses_restaurant_idx on public.menu_analyses(restaurant_id);

alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_analyses enable row level security;

create policy menus_member_all on public.menus
for all using (exists (select 1 from public.restaurants r where r.id = restaurant_id and public.is_org_member(r.organization_id)))
with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and public.is_org_member(r.organization_id)));

create policy menu_items_member_all on public.menu_items
for all using (exists (select 1 from public.menus m join public.restaurants r on r.id = m.restaurant_id where m.id = menu_id and public.is_org_member(r.organization_id)))
with check (exists (select 1 from public.menus m join public.restaurants r on r.id = m.restaurant_id where m.id = menu_id and public.is_org_member(r.organization_id)));

create policy menu_analyses_member_all on public.menu_analyses
for all using (exists (select 1 from public.restaurants r where r.id = restaurant_id and public.is_org_member(r.organization_id)))
with check (exists (select 1 from public.restaurants r where r.id = restaurant_id and public.is_org_member(r.organization_id)));
