-- Return only minimal mentee contact data (name/phone/photo) to the mentor who owns the session
CREATE OR REPLACE FUNCTION public.get_mentee_contact_profiles(session_user_ids uuid[])
RETURNS TABLE (user_id uuid, name text, phone text, photo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
        AND ms.status = 'scheduled'::public.session_status
    );
$$;

-- Lock down execution to authenticated users only
REVOKE ALL ON FUNCTION public.get_mentee_contact_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mentee_contact_profiles(uuid[]) TO authenticated;