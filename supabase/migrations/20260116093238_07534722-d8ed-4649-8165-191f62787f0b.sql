-- Fix volunteer signup: allow INSERT into volunteer_applications for anon and authenticated

-- Ensure table has RLS enabled (no-op if already enabled)
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

-- Grants (PostgREST still requires table privileges in addition to RLS)
GRANT INSERT ON public.volunteer_applications TO anon;
GRANT INSERT ON public.volunteer_applications TO authenticated;
GRANT UPDATE ON public.volunteer_applications TO authenticated;

-- Create INSERT policy to allow public submissions, but prevent spoofing another user's id
DROP POLICY IF EXISTS "Anyone can submit volunteer applications" ON public.volunteer_applications;
CREATE POLICY "Anyone can submit volunteer applications"
ON public.volunteer_applications
FOR INSERT
WITH CHECK (
  (user_id IS NULL) OR (auth.uid() = user_id)
);

-- Allow admins to update applications (e.g. status)
DROP POLICY IF EXISTS "Admins can update volunteer applications" ON public.volunteer_applications;
CREATE POLICY "Admins can update volunteer applications"
ON public.volunteer_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
