-- Function to add volunteer role to existing user by email
CREATE OR REPLACE FUNCTION public.add_volunteer_role_by_email(mentor_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Only admins can call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can add volunteer roles';
  END IF;

  -- Find user by email in auth.users
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = mentor_email;
  
  -- If user exists, add the volunteer role
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'voluntario')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;