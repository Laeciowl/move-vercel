CREATE POLICY "Mentees can report their own attendance"
ON public.mentee_attendance FOR INSERT
TO authenticated
WITH CHECK (mentee_user_id = auth.uid());