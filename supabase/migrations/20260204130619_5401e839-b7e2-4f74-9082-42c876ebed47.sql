-- Corrigir security definer view adicionando security_invoker
DROP VIEW IF EXISTS public.mentors_public;
CREATE VIEW public.mentors_public
WITH (security_invoker = on)
AS
SELECT
  id, name, area, description, education, photo_url, availability, status,
  disclaimer_accepted, disclaimer_accepted_at, created_at,
  min_advance_hours, sessions_completed_count, linkedin_url
FROM public.mentors
WHERE status = 'approved'::mentor_status;