-- Add policy to allow authenticated users to see approved mentors
-- This is needed because mentors_public view uses security_invoker=on
CREATE POLICY "Authenticated users can view approved mentors"
ON public.mentors
FOR SELECT
USING (status = 'approved'::mentor_status);