# GGA Production Launch Checklist

## P0
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Supabase migrations applied in order
- [ ] `OPENROUTER_API_KEY` stored only as a server secret
- [ ] Auth signup/login/reset verified
- [ ] RLS verified for every restaurant-owned table
- [ ] Advisor end-to-end verified with a real authenticated user
- [ ] Menu analyzer end-to-end verified
- [ ] Review analyzer end-to-end verified
- [ ] Recommendation engine end-to-end verified
- [ ] Actions flow verified
- [ ] AI fallback verified

## P1
- [ ] AI run telemetry visible to operator
- [ ] AI quality thresholds enforced
- [ ] Usage limits enforced server-side
- [ ] Subscription state and entitlements verified
- [ ] Billing webhook verified
- [ ] Mobile onboarding verified
- [ ] Mobile first-value flow verified
- [ ] Error and retry states verified

## P2
- [ ] SEO metadata
- [ ] OpenGraph/Twitter cards
- [ ] Performance budget
- [ ] Analytics events
- [ ] Conversion funnel
- [ ] Customer feedback loop

## Launch smoke test

Signup -> Onboarding -> Restaurant Profile -> Advisor -> Diagnosis -> Priority -> Action -> Upgrade.

Any failure in this path blocks launch.
