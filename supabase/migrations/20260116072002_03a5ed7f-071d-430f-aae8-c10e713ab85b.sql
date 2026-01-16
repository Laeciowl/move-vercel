-- Fix mentor INSERT policy - require authenticated users
DROP POLICY IF EXISTS "Anyone can apply to be a mentor" ON public.mentors;

CREATE POLICY "Authenticated users can apply to be a mentor"
  ON public.mentors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Check if volunteer_applications has a similar issue and fix it
DROP POLICY IF EXISTS "Users can submit volunteer applications" ON public.volunteer_applications;
DROP POLICY IF EXISTS "Anyone can submit volunteer applications" ON public.volunteer_applications;

CREATE POLICY "Authenticated users can submit volunteer applications"
  ON public.volunteer_applications FOR INSERT
  TO authenticated
  WITH CHECK (true);