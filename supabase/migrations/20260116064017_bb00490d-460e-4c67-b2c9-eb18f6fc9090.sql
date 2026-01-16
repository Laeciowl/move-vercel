-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create a more permissive INSERT policy that allows authenticated users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Also create a trigger to auto-create profile on signup (backup method)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if profile doesn't already exist
  INSERT INTO public.profiles (user_id, name, age, city, state, professional_status, income_range, lgpd_consent)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, 18),
    COALESCE(NEW.raw_user_meta_data->>'city', 'N/A'),
    COALESCE(NEW.raw_user_meta_data->>'state', 'N/A'),
    COALESCE((NEW.raw_user_meta_data->>'professional_status')::public.professional_status, 'estudante'),
    COALESCE((NEW.raw_user_meta_data->>'income_range')::public.income_range, 'sem_renda'),
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users (if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();