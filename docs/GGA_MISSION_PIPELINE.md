# GGA Mission Pipeline

The Growth Advisor Engine converts a diagnosed opportunity into a measurable, approval-aware mission.

```text
business context
  -> opportunity signals
  -> decision engine
  -> mission builder
  -> action builder
  -> autonomy policy
  -> customer approval
  -> execution
  -> measurement
  -> outcome
  -> learning
```

## Design rules

1. The decision engine ranks opportunities before a mission is created.
2. The mission builder remains deterministic. The LLM supplies reasoning and candidate content, while domain code owns lifecycle and contracts.
3. Actions inherit explicit risk, autonomy and approval requirements.
4. A draft mission enters `awaiting_approval` before customer-controlled execution.
5. Every mission declares measurement KPIs.
6. Outcomes feed the learning loop only after measurement quality is sufficient.
7. Vertical-specific logic belongs in domain packs, not in the shared engine.

## Production path

`Advisor -> Decision -> Mission -> Actions -> Approval -> Execution -> Measurement -> Outcome -> Learning`

The next integration step is wiring `buildGrowthMission()` into the existing Advisor/Growth Loop path and persisting the resulting mission and action contracts through Supabase RLS.
