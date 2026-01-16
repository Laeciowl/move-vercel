-- Fix security definer warning: recreate view with security_invoker=on
DROP VIEW IF EXISTS public.mentors_public;

CREATE VIEW public.mentors_public
WITH (security_invoker = on)
AS
SELECT
  id,
  name,
  area,
  description,
  education,
  photo_url,
  availability,
  status,
  disclaimer_accepted,
  disclaimer_accepted_at,
  created_at
FROM public.mentors
WHERE status = 'approved'::public.mentor_status;

-- Re-grant access
GRANT SELECT ON public.mentors_public TO anon;
GRANT SELECT ON public.mentors_public TO authenticated;