-- Recreate mentors_public view WITHOUT security_invoker to bypass RLS restrictions
-- This allows all authenticated users to see approved mentors

DROP VIEW IF EXISTS public.mentors_public;

CREATE VIEW public.mentors_public AS
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
WHERE status = 'approved';

-- Grant SELECT to all roles
GRANT SELECT ON public.mentors_public TO anon;
GRANT SELECT ON public.mentors_public TO authenticated;