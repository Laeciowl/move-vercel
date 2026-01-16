-- Fix RLS policies that reference auth.users (can cause permission errors)

-- 1) Helper: get current user's email from JWT (no auth.users access)
create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(auth.jwt() ->> 'email', '');
$$;

-- 2) mentors: allow admin or the mentor (by email) without querying auth.users
DROP POLICY IF EXISTS "Admins or mentor can view mentor row" ON public.mentors;
CREATE POLICY "Admins or mentor can view mentor row"
ON public.mentors
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR email = public.current_user_email()
);

DROP POLICY IF EXISTS "Mentors can update their own profile" ON public.mentors;
CREATE POLICY "Mentors can update their own profile"
ON public.mentors
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR email = public.current_user_email()
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR email = public.current_user_email()
);

-- 3) mentor_sessions: allow mentee (user_id) or mentor (by mentor email) without auth.users
DROP POLICY IF EXISTS "Users and mentors can view sessions" ON public.mentor_sessions;
CREATE POLICY "Users and mentors can view sessions"
ON public.mentor_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR exists (
    select 1
    from public.mentors m
    where m.id = mentor_sessions.mentor_id
      and m.email = public.current_user_email()
  )
);

DROP POLICY IF EXISTS "Users and mentors can update sessions" ON public.mentor_sessions;
CREATE POLICY "Users and mentors can update sessions"
ON public.mentor_sessions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR exists (
    select 1
    from public.mentors m
    where m.id = mentor_sessions.mentor_id
      and m.email = public.current_user_email()
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR exists (
    select 1
    from public.mentors m
    where m.id = mentor_sessions.mentor_id
      and m.email = public.current_user_email()
  )
);

-- 4) volunteer_submissions: make volunteer insert/select rely on JWT email + roles
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.volunteer_submissions;
CREATE POLICY "Admins can view all submissions"
ON public.volunteer_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update submissions" ON public.volunteer_submissions;
CREATE POLICY "Admins can update submissions"
ON public.volunteer_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete submissions" ON public.volunteer_submissions;
CREATE POLICY "Admins can delete submissions"
ON public.volunteer_submissions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Submitters can view own submissions" ON public.volunteer_submissions;
CREATE POLICY "Submitters can view own submissions"
ON public.volunteer_submissions
FOR SELECT
TO authenticated
USING (
  volunteer_email = public.current_user_email()
);

DROP POLICY IF EXISTS "Volunteers can submit content" ON public.volunteer_submissions;
CREATE POLICY "Volunteers can submit content"
ON public.volunteer_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(), 'voluntario') OR public.has_role(auth.uid(), 'admin'))
  AND volunteer_email = public.current_user_email()
);

-- 5) volunteer_applications: admin update should be authenticated-only
DROP POLICY IF EXISTS "Admins can update volunteer applications" ON public.volunteer_applications;
CREATE POLICY "Admins can update volunteer applications"
ON public.volunteer_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
