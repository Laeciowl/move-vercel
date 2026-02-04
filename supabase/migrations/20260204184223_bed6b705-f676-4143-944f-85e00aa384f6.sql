-- Create a secure function to get public mentor data for the showcase
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
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;