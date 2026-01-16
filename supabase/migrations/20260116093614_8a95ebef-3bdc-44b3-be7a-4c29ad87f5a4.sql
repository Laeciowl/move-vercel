-- Fix: Allow public volunteer applications (no login required)
-- Volunteers fill form publicly, admin approves later

-- Grant INSERT to anon for volunteer_applications
GRANT INSERT ON public.volunteer_applications TO anon;

-- Drop the authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can submit volunteer applications" ON public.volunteer_applications;

-- Create permissive policy for public volunteer applications
-- user_id can be null (anonymous) or match the authenticated user if logged in
CREATE POLICY "Public volunteer applications"
ON public.volunteer_applications
FOR INSERT
WITH CHECK (
  user_id IS NULL 
  OR auth.uid() = user_id
);

-- Also allow public mentor applications (they submit together)
GRANT INSERT ON public.mentors TO anon;

DROP POLICY IF EXISTS "Authenticated users can apply to be a mentor" ON public.mentors;
CREATE POLICY "Public mentor applications"
ON public.mentors
FOR INSERT
WITH CHECK (true);