-- Update the trigger function to include phone from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only insert if profile doesn't already exist
  INSERT INTO public.profiles (user_id, name, age, city, state, professional_status, income_range, lgpd_consent, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, 18),
    COALESCE(NEW.raw_user_meta_data->>'city', 'N/A'),
    COALESCE(NEW.raw_user_meta_data->>'state', 'N/A'),
    COALESCE((NEW.raw_user_meta_data->>'professional_status')::public.professional_status, 'estudante'),
    COALESCE((NEW.raw_user_meta_data->>'income_range')::public.income_range, 'sem_renda'),
    true,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;