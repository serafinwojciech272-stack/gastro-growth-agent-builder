alter table if exists public.website_preview_sessions
  add column if not exists audit_snapshot jsonb;

create table if not exists public.website_rebuild_requests (
  id uuid primary key default gen_random_uuid(),
  preview_session_id uuid not null references public.website_preview_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','approved','rejected','running','completed','failed')),
  audit_score integer not null check (audit_score between 0 and 100),
  trust_confidence numeric(4,3) not null check (trust_confidence between 0 and 1),
  created_at timestamptz not null default now()
);

alter table public.website_rebuild_requests enable row level security;
create policy "users read own rebuild requests" on public.website_rebuild_requests for select using (auth.uid() = user_id);
create policy "users create own rebuild requests" on public.website_rebuild_requests for insert with check (auth.uid() = user_id);

create index if not exists website_rebuild_requests_session_idx on public.website_rebuild_requests(preview_session_id);
create index if not exists website_rebuild_requests_user_idx on public.website_rebuild_requests(user_id);
