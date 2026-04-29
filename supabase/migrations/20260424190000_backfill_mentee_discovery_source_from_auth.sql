-- Backfill profiles.mentee_discovery_source from auth.users.raw_user_meta_data
-- when the column is NULL but signup metadata still has a valid enum value.
-- (Common after ADD COLUMN or if an older trigger inserted profiles without this field.)

UPDATE public.profiles p
SET mentee_discovery_source = (
  CASE u.raw_user_meta_data->>'mentee_discovery_source'
    WHEN 'indicacao' THEN 'indicacao'::public.mentee_discovery_source
    WHEN 'linkedin' THEN 'linkedin'::public.mentee_discovery_source
    WHEN 'redes_sociais' THEN 'redes_sociais'::public.mentee_discovery_source
    WHEN 'outro' THEN 'outro'::public.mentee_discovery_source
    ELSE NULL
  END
)
FROM auth.users u
WHERE u.id = p.user_id
  AND p.mentee_discovery_source IS NULL
  AND u.raw_user_meta_data->>'mentee_discovery_source' IN (
    'indicacao',
    'linkedin',
    'redes_sociais',
    'outro'
  );
