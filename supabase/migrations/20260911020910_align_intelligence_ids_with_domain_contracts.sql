-- Domain artifact IDs are opaque strings, not UUIDs. Align persistence without
-- changing the Universal Business Core contract or existing data semantics.
alter table public.business_opportunities drop constraint if exists business_opportunities_source_diagnosis_id_fkey;
alter table public.business_recommendations drop constraint if exists business_recommendations_opportunity_id_fkey;
alter table public.business_priority_scores drop constraint if exists business_priority_scores_opportunity_id_fkey;
alter table public.business_diagnoses alter column id drop default, alter column id type text using id::text;
alter table public.business_opportunities alter column id drop default, alter column id type text using id::text;
alter table public.business_opportunities alter column source_diagnosis_id type text using source_diagnosis_id::text;
alter table public.business_recommendations alter column opportunity_id type text using opportunity_id::text;
alter table public.business_priority_scores alter column opportunity_id type text using opportunity_id::text;
alter table public.business_diagnoses alter column id set default (gen_random_uuid()::text);
alter table public.business_opportunities alter column id set default (gen_random_uuid()::text);
alter table public.business_recommendations alter column id drop default, alter column id type text using id::text, alter column id set default (gen_random_uuid()::text);
alter table public.business_opportunities add constraint business_opportunities_source_diagnosis_id_fkey foreign key (source_diagnosis_id) references public.business_diagnoses(id) on delete set null;
alter table public.business_recommendations add constraint business_recommendations_opportunity_id_fkey foreign key (opportunity_id) references public.business_opportunities(id) on delete cascade;
alter table public.business_priority_scores add constraint business_priority_scores_opportunity_id_fkey foreign key (opportunity_id) references public.business_opportunities(id) on delete cascade;
