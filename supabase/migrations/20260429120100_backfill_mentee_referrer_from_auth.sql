-- Optional backfill if mentee_referrer_name was ever present in auth metadata but not synced
UPDATE public.profiles p
SET mentee_referrer_name = LEFT(
  TRIM(COALESCE(u.raw_user_meta_data->>'mentee_referrer_name', '')),
  200
)
FROM auth.users u
WHERE p.user_id = u.id
  AND p.mentee_discovery_source = 'indicacao'::public.mentee_discovery_source
  AND (p.mentee_referrer_name IS NULL OR TRIM(p.mentee_referrer_name) = '')
  AND TRIM(COALESCE(u.raw_user_meta_data->>'mentee_referrer_name', '')) <> '';
