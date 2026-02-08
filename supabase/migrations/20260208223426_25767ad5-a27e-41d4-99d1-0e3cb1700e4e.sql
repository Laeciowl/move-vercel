
-- 1. Add temporarily_unavailable column to mentors (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mentors' AND column_name = 'temporarily_unavailable') THEN
    ALTER TABLE public.mentors ADD COLUMN temporarily_unavailable BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 2. Update the mentors_public view to include the new column
DROP VIEW IF EXISTS public.mentors_public CASCADE;
CREATE VIEW public.mentors_public WITH (security_invoker = on) AS
SELECT 
  id, name, area, description, education, photo_url,
  availability, status, disclaimer_accepted, disclaimer_accepted_at,
  created_at, min_advance_hours, sessions_completed_count, linkedin_url,
  temporarily_unavailable
FROM public.mentors;

-- 3. Update validate_mentor_availability trigger to allow optional 'duration' field
CREATE OR REPLACE FUNCTION public.validate_mentor_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  element jsonb;
BEGIN
  IF jsonb_typeof(NEW.availability) != 'array' THEN
    RAISE EXCEPTION 'Availability must be an array';
  END IF;
  
  FOR element IN SELECT * FROM jsonb_array_elements(NEW.availability)
  LOOP
    IF NOT (element ? 'day' AND element ? 'times') THEN
      RAISE EXCEPTION 'Each availability entry must have day and times fields';
    END IF;
    
    IF jsonb_typeof(element->'times') != 'array' THEN
      RAISE EXCEPTION 'Times must be an array';
    END IF;
    
    IF NOT (element->>'day' IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')) THEN
      RAISE EXCEPTION 'Invalid day value: %', element->>'day';
    END IF;
    
    -- Validate optional duration field (must be 30, 45, or 60)
    IF element ? 'duration' THEN
      IF NOT ((element->>'duration')::int IN (30, 45, 60)) THEN
        RAISE EXCEPTION 'Duration must be 30, 45, or 60 minutes';
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- 4. Drop and recreate get_mentors_with_match with new return type
DROP FUNCTION IF EXISTS public.get_mentors_with_match(uuid);

CREATE FUNCTION public.get_mentors_with_match(user_id_param uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid, name text, area text, description text, education text, 
  photo_url text, availability jsonb, min_advance_hours integer, 
  sessions_completed_count integer, linkedin_url text, tags jsonb, 
  match_count integer, matching_tags jsonb, temporarily_unavailable boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH mentor_tag_data AS (
    SELECT 
      mt.mentor_id,
      jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'category', t.category, 'slug', t.slug)) as tags
    FROM public.mentor_tags mt
    JOIN public.tags t ON t.id = mt.tag_id
    GROUP BY mt.mentor_id
  ),
  user_interests AS (
    SELECT tag_id FROM public.mentee_interests WHERE mentee_interests.user_id = user_id_param
  ),
  mentor_matches AS (
    SELECT 
      mt.mentor_id,
      COUNT(*)::INTEGER as match_count,
      jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'category', t.category, 'slug', t.slug)) as matching_tags
    FROM public.mentor_tags mt
    JOIN public.tags t ON t.id = mt.tag_id
    WHERE mt.tag_id IN (SELECT tag_id FROM user_interests)
    GROUP BY mt.mentor_id
  )
  SELECT 
    m.id,
    m.name,
    m.area,
    m.description,
    m.education,
    m.photo_url,
    m.availability,
    m.min_advance_hours,
    (
      SELECT COALESCE(COUNT(*)::integer, 0)
      FROM public.mentor_sessions ms
      WHERE ms.mentor_id = m.id
        AND ms.status = 'scheduled'
        AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW()
    ) AS sessions_completed_count,
    m.linkedin_url,
    COALESCE(mtd.tags, '[]'::jsonb) as tags,
    COALESCE(mm.match_count, 0) as match_count,
    COALESCE(mm.matching_tags, '[]'::jsonb) as matching_tags,
    m.temporarily_unavailable
  FROM public.mentors m
  LEFT JOIN mentor_tag_data mtd ON mtd.mentor_id = m.id
  LEFT JOIN mentor_matches mm ON mm.mentor_id = m.id
  WHERE m.status = 'approved'
  ORDER BY 
    m.temporarily_unavailable ASC,
    COALESCE(mm.match_count, 0) DESC,
    (
      SELECT COALESCE(COUNT(*)::integer, 0)
      FROM public.mentor_sessions ms
      WHERE ms.mentor_id = m.id
        AND ms.status = 'scheduled'
        AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW()
    ) DESC,
    m.created_at ASC;
END;
$function$;

-- 5. Drop and recreate get_public_mentors with new return type
DROP FUNCTION IF EXISTS public.get_public_mentors();

CREATE FUNCTION public.get_public_mentors()
RETURNS TABLE(
  id uuid, name text, area text, description text, education text, 
  photo_url text, availability jsonb, min_advance_hours integer, 
  sessions_completed_count integer, linkedin_url text, temporarily_unavailable boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    (
      SELECT COALESCE(COUNT(*)::integer, 0)
      FROM public.mentor_sessions ms
      WHERE ms.mentor_id = m.id
        AND ms.status = 'scheduled'
        AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW()
    ) AS sessions_completed_count,
    m.linkedin_url,
    m.temporarily_unavailable
  FROM public.mentors m
  WHERE m.status = 'approved'
  ORDER BY m.temporarily_unavailable ASC, sessions_completed_count DESC, m.created_at ASC;
END;
$function$;
