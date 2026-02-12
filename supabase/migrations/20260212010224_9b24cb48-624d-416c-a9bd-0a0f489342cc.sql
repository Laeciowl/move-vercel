-- Fix get_mentee_contact_profiles to include completed sessions (not just scheduled)
-- This fixes the bug where mentee names disappear after marking sessions as completed
CREATE OR REPLACE FUNCTION public.get_mentee_contact_profiles(session_user_ids uuid[])
 RETURNS TABLE(user_id uuid, name text, phone text, photo_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH mentor AS (
    SELECT id
    FROM public.mentors
    WHERE email = public.current_user_email()
    LIMIT 1
  )
  SELECT p.user_id, p.name, p.phone, p.photo_url
  FROM public.profiles p
  WHERE p.user_id = ANY(session_user_ids)
    AND EXISTS (
      SELECT 1
      FROM public.mentor_sessions ms
      JOIN mentor m ON m.id = ms.mentor_id
      WHERE ms.user_id = p.user_id
        AND ms.status IN ('scheduled', 'completed')
    );
$function$;