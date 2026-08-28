create or replace view public.ai_model_scorecard_v2 as
with grouped as (
  select
    task,
    model,
    count(*)::integer as runs,
    count(*) filter (where success)::integer as successful_runs,
    round((100.0 * count(*) filter (where success) / nullif(count(*), 0))::numeric, 2) as success_rate,
    round(avg(latency_ms)::numeric, 0) as avg_latency_ms,
    round(avg(total_tokens)::numeric, 0) as avg_total_tokens,
    round(avg(quality_score)::numeric, 2) as avg_quality_score,
    count(*) filter (where attempts > 1)::integer as fallback_runs,
    max(created_at) as last_run_at
  from public.ai_runs
  group by task, model
)
select
  *,
  round((
    coalesce(success_rate, 0) * 0.45 +
    coalesce(avg_quality_score, 0) * 0.45 +
    greatest(0, least(100, 100 - (coalesce(avg_latency_ms, 0) / 100.0))) * 0.10
  )::numeric, 2) as model_score,
  (runs >= 5) as statistically_useful
from grouped;

grant select on public.ai_model_scorecard_v2 to authenticated;
