-- Fix 1: Secure the add_admin_by_email function with admin authorization check
CREATE OR REPLACE FUNCTION public.add_admin_by_email(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- CRITICAL: Only existing admins can add new admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can add admin roles';
  END IF;

  -- Find user by email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', admin_email;
  END IF;
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Fix 2: Restrict mentor email visibility
-- Drop the overly permissive policy that exposes emails to all authenticated users
DROP POLICY IF EXISTS "Anyone can view approved mentors" ON public.mentors;

-- Create a new policy that only shows approved mentors but uses mentors_public view pattern
-- Regular authenticated users can only see approved mentors' non-sensitive data via the view
-- The base mentors table should only be accessible by admins or the mentor themselves
CREATE POLICY "Admins can view all mentors"
ON public.mentors
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Mentors can view their own record"
ON public.mentors
FOR SELECT
USING (email = public.current_user_email());

-- Revoke direct anon access to mentors table (they should use mentors_public view)
REVOKE SELECT ON public.mentors FROM anon;

-- Make mentors_public view accessible to everyone (including anon for public listing)
GRANT SELECT ON public.mentors_public TO anon;
GRANT SELECT ON public.mentors_public TO authenticated;