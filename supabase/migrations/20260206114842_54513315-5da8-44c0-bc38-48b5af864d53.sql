CREATE OR REPLACE FUNCTION public.get_mentor_unlocked_achievements(mentor_ids uuid[])
RETURNS TABLE(mentor_id uuid, icon text, achievement_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT m.id as mentor_id, a.icon, a.name as achievement_name
  FROM public.mentors m
  JOIN auth.users au ON au.email = m.email
  JOIN public.user_achievements ua ON ua.user_id = au.id
  JOIN public.achievements a ON a.id = ua.achievement_id
  WHERE m.id = ANY(mentor_ids)
    AND m.status = 'approved'
    AND ua.unlocked_at IS NOT NULL
    AND a.active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_mentor_unlocked_achievements(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mentor_unlocked_achievements(uuid[]) TO anon;