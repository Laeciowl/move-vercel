-- Fix mentor_blocked_periods policy to only allow authenticated users
DROP POLICY IF EXISTS "Anyone can view blocked periods" ON public.mentor_blocked_periods;

CREATE POLICY "Authenticated users can view blocked periods"
  ON public.mentor_blocked_periods FOR SELECT
  TO authenticated
  USING (true);

-- Also make mentors SELECT policy more restrictive - only authenticated users
DROP POLICY IF EXISTS "Anyone can view approved mentors" ON public.mentors;

CREATE POLICY "Authenticated users can view approved mentors"
  ON public.mentors FOR SELECT
  TO authenticated
  USING (status = 'approved');