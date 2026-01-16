-- Fix mentor_blocked_periods - ensure only authenticated users can view
DROP POLICY IF EXISTS "Authenticated users can view blocked periods" ON public.mentor_blocked_periods;
DROP POLICY IF EXISTS "Anyone can view blocked periods" ON public.mentor_blocked_periods;

CREATE POLICY "Authenticated users can view blocked periods"
  ON public.mentor_blocked_periods FOR SELECT
  TO authenticated
  USING (true);

-- Create a function to add admin by email (will be called after user signs up)
CREATE OR REPLACE FUNCTION public.add_admin_by_email(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = admin_email;
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;