-- Fix security vulnerability: Add mentor session ownership verification to get_mentee_emails
-- This prevents any authenticated user from extracting emails by guessing user IDs

CREATE OR REPLACE FUNCTION public.get_mentee_emails(session_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_mentor AS (
    SELECT id FROM public.mentors 
    WHERE email = public.current_user_email()
    LIMIT 1
  )
  SELECT au.id as user_id, au.email::text as email
  FROM auth.users au
  WHERE au.id = ANY(session_user_ids)
    AND EXISTS (
      SELECT 1 FROM public.mentor_sessions ms
      JOIN current_mentor cm ON cm.id = ms.mentor_id
      WHERE ms.user_id = au.id
    );
$$;