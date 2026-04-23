-- How mentees heard about Movê (signup attribution)
CREATE TYPE public.mentee_discovery_source AS ENUM (
  'indicacao',
  'linkedin',
  'redes_sociais',
  'outro'
);

ALTER TABLE public.profiles
  ADD COLUMN mentee_discovery_source public.mentee_discovery_source;

COMMENT ON COLUMN public.profiles.mentee_discovery_source IS
  'Self-reported channel through which the mentee found Movê (mentee signup only).';

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_discovery public.mentee_discovery_source;
BEGIN
  IF NEW.raw_user_meta_data->>'mentee_discovery_source' IN ('indicacao', 'linkedin', 'redes_sociais', 'outro') THEN
    v_discovery := (NEW.raw_user_meta_data->>'mentee_discovery_source')::public.mentee_discovery_source;
  ELSE
    v_discovery := NULL;
  END IF;

  INSERT INTO public.profiles (
    user_id,
    name,
    age,
    city,
    state,
    professional_status,
    income_range,
    lgpd_consent,
    phone,
    mentee_discovery_source
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, 18),
    COALESCE(NEW.raw_user_meta_data->>'city', 'N/A'),
    COALESCE(NEW.raw_user_meta_data->>'state', 'N/A'),
    COALESCE((NEW.raw_user_meta_data->>'professional_status')::public.professional_status, 'estudante'),
    COALESCE((NEW.raw_user_meta_data->>'income_range')::public.income_range, 'sem_renda'),
    true,
    NEW.raw_user_meta_data->>'phone',
    v_discovery
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;
