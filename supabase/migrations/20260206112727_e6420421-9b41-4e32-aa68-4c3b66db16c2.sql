-- Allow admins to view all mentor sessions
CREATE POLICY "Admins can view all sessions"
ON public.mentor_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
