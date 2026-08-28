create index if not exists growth_outcomes_status_idx on public.growth_outcomes(status, measured_at desc);
create index if not exists growth_outcomes_metrics_gin_idx on public.growth_outcomes using gin(metrics);
create index if not exists growth_events_type_idx on public.growth_events(type, created_at desc);
