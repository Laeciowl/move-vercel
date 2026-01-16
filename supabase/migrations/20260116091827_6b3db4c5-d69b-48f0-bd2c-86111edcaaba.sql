-- Fix permissions + secure mentor visibility

-- 1) Ensure the public mentors view exists (safe fields only)
CREATE OR REPLACE VIEW public.mentors_public AS
SELECT
  id,
  name,
  area,
  description,
  education,
  photo_url,
  availability,
  status,
  disclaimer_accepted,
  disclaimer_accepted_at,
  created_at
FROM public.mentors
WHERE status = 'approved'::public.mentor_status;

-- 2) Grant access to the public view for browsing mentors without login
GRANT SELECT ON public.mentors_public TO anon;
GRANT SELECT ON public.mentors_public TO authenticated;

-- 3) Lock down direct SELECT on mentors table (avoid leaking mentor emails)
--    Students should use mentors_public; admins + the mentor themself can read mentors.
DROP POLICY IF EXISTS "View mentors policy" ON public.mentors;

CREATE POLICY "Admins or mentor can view mentor row"
ON public.mentors
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR email = (
    SELECT u.email
    FROM auth.users u
    WHERE u.id = auth.uid()
  )
);

-- 4) Ensure authenticated users can operate on mentors table (RLS still applies)
GRANT SELECT, INSERT, UPDATE ON public.mentors TO authenticated;

-- Prevent anon from directly selecting mentors table
REVOKE ALL ON public.mentors FROM anon;