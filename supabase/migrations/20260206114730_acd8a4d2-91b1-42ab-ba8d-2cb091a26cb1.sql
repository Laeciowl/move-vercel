CREATE OR REPLACE FUNCTION public.get_mentor_user_ids(mentor_ids uuid[])
RETURNS TABLE(mentor_id uuid, user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT m.id as mentor_id, au.id as user_id
  FROM public.mentors m
  JOIN auth.users au ON au.email = m.email
  WHERE m.id = ANY(mentor_ids)
    AND m.status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.get_mentor_user_ids(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mentor_user_ids(uuid[]) TO anon;