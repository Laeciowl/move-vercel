-- Run in Supabase SQL Editor (Production) after a backup/restore.
-- Does NOT change data. Use results to see if repair script is needed.

-- 1) Was the experimental referral_registrations feature ever applied?
select to_regclass('public.referral_registrations') is not null as has_referral_registrations;

-- 2) Does the public lookup function exist?
select exists(
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'get_public_referrer_name_by_code'
) as has_get_public_referrer_name_by_code;

-- 3) Snippet of process_referral_on_signup body (search for referral_registrations = new behavior)
select pg_get_functiondef('public.process_referral_on_signup(text,uuid)'::regprocedure) as process_referral_fn;

-- 4) Optional: migration history tail (Supabase tracks applied files here)
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 15;
