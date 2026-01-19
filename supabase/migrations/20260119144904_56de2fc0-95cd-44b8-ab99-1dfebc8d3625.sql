-- Create a function to get user emails for mentor sessions
-- This allows mentors to see the email of their mentees
CREATE OR REPLACE FUNCTION public.get_mentee_emails(session_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id as user_id,
    au.email::text as email
  FROM auth.users au
  WHERE au.id = ANY(session_user_ids);
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_mentee_emails(uuid[]) TO authenticated;