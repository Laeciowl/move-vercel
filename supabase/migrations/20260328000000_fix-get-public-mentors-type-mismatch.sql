
DROP FUNCTION IF EXISTS public.get_public_mentors();
DROP FUNCTION IF EXISTS public.get_mentors_with_match(uuid);

CREATE OR REPLACE FUNCTION public.get_public_mentors()
 RETURNS TABLE(id uuid, name text, area text, description text, education text, photo_url text, availability jsonb, min_advance_hours integer, sessions_completed_count integer, linkedin_url text, temporarily_unavailable boolean, anos_experiencia integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, m.area, m.description, m.education, m.photo_url, m.availability, m.min_advance_hours::integer, m.sessions_completed_count::integer, m.linkedin_url, m.temporarily_unavailable, m.anos_experiencia::integer
  FROM public.mentors m WHERE m.status = 'approved'
  ORDER BY m.temporarily_unavailable ASC, m.sessions_completed_count DESC, m.created_at ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_public_mentors() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_mentors_with_match(user_id_param uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, name text, area text, description text, education text, photo_url text, availability jsonb, min_advance_hours integer, sessions_completed_count integer, linkedin_url text, tags jsonb, match_count integer, matching_tags jsonb, temporarily_unavailable boolean, anos_experiencia integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH mentor_tag_data AS (
    SELECT mt.mentor_id, jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'category', t.category, 'slug', t.slug)) as tags
    FROM public.mentor_tags mt JOIN public.tags t ON t.id = mt.tag_id GROUP BY mt.mentor_id
  ),
  user_interests AS (
    SELECT tag_id FROM public.mentee_interests WHERE mentee_interests.user_id = user_id_param
  ),
  mentor_matches AS (
    SELECT mt.mentor_id, COUNT(*)::INTEGER as match_count,
      jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'category', t.category, 'slug', t.slug)) as matching_tags
    FROM public.mentor_tags mt JOIN public.tags t ON t.id = mt.tag_id
    WHERE mt.tag_id IN (SELECT tag_id FROM user_interests) GROUP BY mt.mentor_id
  )
  SELECT m.id, m.name, m.area, m.description, m.education, m.photo_url, m.availability,
    m.min_advance_hours::integer, m.sessions_completed_count::integer, m.linkedin_url,
    COALESCE(mtd.tags, '[]'::jsonb), COALESCE(mm.match_count, 0),
    COALESCE(mm.matching_tags, '[]'::jsonb), m.temporarily_unavailable, m.anos_experiencia::integer
  FROM public.mentors m
  LEFT JOIN mentor_tag_data mtd ON mtd.mentor_id = m.id
  LEFT JOIN mentor_matches mm ON mm.mentor_id = m.id
  WHERE m.status = 'approved'
  ORDER BY m.temporarily_unavailable ASC, COALESCE(mm.match_count, 0) DESC, m.sessions_completed_count DESC, m.created_at ASC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_mentors_with_match(uuid) TO anon, authenticated;
