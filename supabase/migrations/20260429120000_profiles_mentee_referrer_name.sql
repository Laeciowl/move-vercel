-- Free text: who referred the mentee (when discovery source is indicacao)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mentee_referrer_name text;

COMMENT ON COLUMN public.profiles.mentee_referrer_name IS
  'When mentee_discovery_source is indicacao: name of the person who referred them (signup).';

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_discovery public.mentee_discovery_source;
  v_referrer text;
BEGIN
  IF NEW.raw_user_meta_data->>'mentee_discovery_source' IN ('indicacao', 'linkedin', 'redes_sociais', 'outro') THEN
    v_discovery := (NEW.raw_user_meta_data->>'mentee_discovery_source')::public.mentee_discovery_source;
  ELSE
    v_discovery := NULL;
  END IF;

  IF v_discovery = 'indicacao'::public.mentee_discovery_source THEN
    v_referrer := NULLIF(TRIM(NEW.raw_user_meta_data->>'mentee_referrer_name'), '');
    IF v_referrer IS NOT NULL THEN
      v_referrer := LEFT(v_referrer, 200);
    END IF;
  ELSE
    v_referrer := NULL;
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
    mentee_discovery_source,
    mentee_referrer_name
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
    v_discovery,
    v_referrer
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;
