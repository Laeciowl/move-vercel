-- Fix the mentors_public view - use security_invoker instead of security_definer
DROP VIEW IF EXISTS public.mentors_public;

CREATE VIEW public.mentors_public
WITH (security_invoker = on) AS
  SELECT id, name, area, description, education, photo_url, availability, status, disclaimer_accepted, disclaimer_accepted_at, created_at
  FROM public.mentors
  WHERE status = 'approved';

-- Fix the overly permissive RLS policies
-- First, let's identify which policies are the issue. The "Only admins can manage roles" uses has_role which is fine.
-- The issue is likely from other tables. Let's check mentor_blocked_periods and mentor_sessions.

-- Drop and recreate mentor_blocked_periods INSERT policy with proper check
DROP POLICY IF EXISTS "Mentors can insert their own blocked periods" ON public.mentor_blocked_periods;

CREATE POLICY "Mentors can insert their own blocked periods"
  ON public.mentor_blocked_periods FOR INSERT
  TO authenticated
  WITH CHECK (
    mentor_id IN (
      SELECT id FROM public.mentors 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Fix mentor_sessions INSERT to require authenticated user_id match
DROP POLICY IF EXISTS "Users can create sessions" ON public.mentor_sessions;

CREATE POLICY "Users can create their own sessions"
  ON public.mentor_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);