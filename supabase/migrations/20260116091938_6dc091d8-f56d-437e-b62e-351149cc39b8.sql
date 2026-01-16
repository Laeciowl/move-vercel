-- Allow anyone (anon or authenticated) to read approved mentors
-- This enables mentors_public view to work for everyone
CREATE POLICY "Anyone can view approved mentors"
ON public.mentors
FOR SELECT
USING (status = 'approved'::public.mentor_status);

-- Grant anon the ability to select from mentors (RLS will filter to approved only)
GRANT SELECT ON public.mentors TO anon;