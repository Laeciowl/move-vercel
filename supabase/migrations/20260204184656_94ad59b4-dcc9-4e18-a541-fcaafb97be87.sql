-- Fix: ensure get_public_mentors works for anonymous callers via PostgREST
-- SQL-language functions can be optimized/inlined in some contexts; using PL/pgSQL avoids privilege issues.

CREATE OR REPLACE FUNCTION public.get_public_mentors()
RETURNS TABLE (
  id uuid,
  name text,
  area text,
  description text,
  education text,
  photo_url text,
  availability jsonb,
  min_advance_hours integer,
  sessions_completed_count integer,
  linkedin_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.area,
    m.description,
    m.education,
    m.photo_url,
    m.availability,
    m.min_advance_hours,
    m.sessions_completed_count,
    m.linkedin_url
  FROM public.mentors m
  WHERE m.status = 'approved'
  ORDER BY m.sessions_completed_count DESC, m.created_at ASC;
END;
$$;

-- Be explicit about RPC executability
GRANT EXECUTE ON FUNCTION public.get_public_mentors() TO anon, authenticated;
