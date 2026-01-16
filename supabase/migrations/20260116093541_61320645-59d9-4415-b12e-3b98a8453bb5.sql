-- Require authenticated users for volunteer applications and internal content submissions

-- 1) volunteer_applications: authenticated-only INSERT
REVOKE INSERT ON public.volunteer_applications FROM anon;
GRANT INSERT ON public.volunteer_applications TO authenticated;

DROP POLICY IF EXISTS "Anyone can submit volunteer applications" ON public.volunteer_applications;
CREATE POLICY "Authenticated users can submit volunteer applications"
ON public.volunteer_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2) volunteer_submissions: only volunteers/admins can submit, and must match their own email
REVOKE INSERT ON public.volunteer_submissions FROM anon;
GRANT INSERT ON public.volunteer_submissions TO authenticated;

DROP POLICY IF EXISTS "Anyone can submit content" ON public.volunteer_submissions;
CREATE POLICY "Volunteers can submit content"
ON public.volunteer_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  (
    public.has_role(auth.uid(), 'voluntario'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  AND volunteer_email = (
    (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text
  )
);

-- 3) mentors: prevent impersonation and remove always-true INSERT policy
DROP POLICY IF EXISTS "Authenticated users can apply to be a mentor" ON public.mentors;
CREATE POLICY "Authenticated users can apply to be a mentor"
ON public.mentors
FOR INSERT
TO authenticated
WITH CHECK (
  email = ((SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text)
);
