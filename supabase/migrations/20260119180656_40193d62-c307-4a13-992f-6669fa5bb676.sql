-- Fix RLS policies that incorrectly query auth.users (causes: permission denied for table users)

-- mentor_blocked_periods
DROP POLICY IF EXISTS "Mentors can insert their own blocked periods" ON public.mentor_blocked_periods;
CREATE POLICY "Mentors can insert their own blocked periods"
ON public.mentor_blocked_periods
FOR INSERT
TO authenticated
WITH CHECK (
  mentor_id IN (
    SELECT m.id
    FROM public.mentors m
    WHERE m.email = public.current_user_email()
  )
);

DROP POLICY IF EXISTS "Mentors can delete their own blocked periods" ON public.mentor_blocked_periods;
CREATE POLICY "Mentors can delete their own blocked periods"
ON public.mentor_blocked_periods
FOR DELETE
TO authenticated
USING (
  mentor_id IN (
    SELECT m.id
    FROM public.mentors m
    WHERE m.email = public.current_user_email()
  )
);

-- (Optional but safe) allow mentors to update their own blocked periods if needed later
DROP POLICY IF EXISTS "Mentors can update their own blocked periods" ON public.mentor_blocked_periods;
CREATE POLICY "Mentors can update their own blocked periods"
ON public.mentor_blocked_periods
FOR UPDATE
TO authenticated
USING (
  mentor_id IN (
    SELECT m.id
    FROM public.mentors m
    WHERE m.email = public.current_user_email()
  )
)
WITH CHECK (
  mentor_id IN (
    SELECT m.id
    FROM public.mentors m
    WHERE m.email = public.current_user_email()
  )
);
