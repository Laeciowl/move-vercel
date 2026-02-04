-- Fix: compute sessions_completed_count dynamically based on past scheduled sessions
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
    -- Compute dynamically: count scheduled sessions whose time has passed
    (
      SELECT COALESCE(COUNT(*)::integer, 0)
      FROM public.mentor_sessions ms
      WHERE ms.mentor_id = m.id
        AND ms.status = 'scheduled'
        AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW()
    ) AS sessions_completed_count,
    m.linkedin_url
  FROM public.mentors m
  WHERE m.status = 'approved'
  ORDER BY sessions_completed_count DESC, m.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_mentors() TO anon, authenticated;
