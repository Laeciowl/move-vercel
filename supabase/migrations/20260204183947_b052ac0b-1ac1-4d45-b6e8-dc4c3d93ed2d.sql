-- Create public stats functions that can be called by anyone
CREATE OR REPLACE FUNCTION public.get_public_mentors_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.mentors
  WHERE status = 'approved';
$$;

CREATE OR REPLACE FUNCTION public.get_public_members_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.profiles;
$$;