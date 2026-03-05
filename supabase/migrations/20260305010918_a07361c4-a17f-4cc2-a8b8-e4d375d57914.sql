
-- Now create the feedback functions
CREATE OR REPLACE FUNCTION public.get_mentor_public_feedback_count(mentor_ids uuid[])
RETURNS TABLE(mentor_id uuid, feedback_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT sr.mentor_id, COUNT(*)::integer as feedback_count
  FROM public.session_reviews sr
  WHERE sr.mentor_id = ANY(mentor_ids)
    AND sr.review_publico = true
    AND sr.comment IS NOT NULL AND sr.comment != ''
  GROUP BY sr.mentor_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_mentor_public_feedback_count(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_mentor_public_feedback_count(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_mentor_public_feedbacks(p_mentor_id uuid, p_limit integer DEFAULT 5, p_offset integer DEFAULT 0)
RETURNS TABLE(
  review_id uuid, comment text, created_at timestamptz,
  mentee_name text, mentee_photo_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT sr.id as review_id, sr.comment, sr.created_at,
    p.name as mentee_name, p.photo_url as mentee_photo_url
  FROM public.session_reviews sr
  JOIN public.profiles p ON p.user_id = sr.user_id
  WHERE sr.mentor_id = p_mentor_id
    AND sr.review_publico = true
    AND sr.comment IS NOT NULL AND sr.comment != ''
  ORDER BY sr.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_mentor_public_feedbacks(uuid, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_mentor_public_feedbacks(uuid, integer, integer) TO authenticated;
