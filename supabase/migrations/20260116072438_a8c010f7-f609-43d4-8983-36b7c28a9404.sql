-- Allow admins to manage content_items
CREATE POLICY "Admins can insert content"
  ON public.content_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update content"
  ON public.content_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete content"
  ON public.content_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update mentors (for approval)
DROP POLICY IF EXISTS "Mentors can update their own profile" ON public.mentors;

CREATE POLICY "Mentors can update their own profile"
  ON public.mentors FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Allow admins to view all mentors (not just approved)
DROP POLICY IF EXISTS "Authenticated users can view approved mentors" ON public.mentors;

CREATE POLICY "View mentors policy"
  ON public.mentors FOR SELECT
  TO authenticated
  USING (
    status = 'approved'
    OR public.has_role(auth.uid(), 'admin')
  );