-- Align mentor detection with resilient email matching (avoids missing joins on case/whitespace).
-- Lives impacted: count distinct *mentorados* with ≥1 completed session (exclude approved mentor accounts).

CREATE OR REPLACE FUNCTION public.get_mentor_user_ids(mentor_ids uuid[])
RETURNS TABLE(mentor_id uuid, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.id AS mentor_id, au.id AS user_id
  FROM public.mentors m
  JOIN auth.users au ON lower(trim(au.email)) = lower(trim(m.email))
  WHERE m.id = ANY(mentor_ids)
    AND m.status = 'approved';
$$;

CREATE OR REPLACE FUNCTION public.get_lives_impacted()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(COUNT(DISTINCT ms.user_id)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.status = 'completed'
    AND NOT EXISTS (
      SELECT 1
      FROM public.mentors m
      JOIN auth.users au ON lower(trim(au.email)) = lower(trim(m.email))
      WHERE au.id = ms.user_id
        AND m.status = 'approved'
    );
$function$;

CREATE OR REPLACE FUNCTION public.get_activation_rate()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH non_mentors AS (
    SELECT
      p.user_id,
      COALESCE(p.onboarding_quiz_passed, false) AS onboarding_quiz_passed,
      COALESCE(p.first_mentorship_booked, false) AS first_mentorship_booked
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.mentors m
      JOIN auth.users au ON lower(trim(au.email)) = lower(trim(m.email))
      WHERE au.id = p.user_id
        AND m.status = 'approved'
    )
  ),
  active_mentees AS (
    SELECT nm.user_id
    FROM non_mentors nm
    WHERE nm.onboarding_quiz_passed
      OR nm.first_mentorship_booked
      OR EXISTS (
        SELECT 1
        FROM public.mentor_sessions ms
        WHERE ms.user_id = nm.user_id
      )
  ),
  activated AS (
    SELECT COUNT(DISTINCT ms.user_id)::integer AS total
    FROM public.mentor_sessions ms
    INNER JOIN active_mentees am ON am.user_id = ms.user_id
    WHERE ms.status = 'completed'
  ),
  counts AS (
    SELECT
      (SELECT COUNT(*)::integer FROM active_mentees) AS active_n,
      (SELECT total FROM activated) AS activated_n
  )
  SELECT jsonb_build_object(
    'active_mentees', counts.active_n,
    'activated', counts.activated_n,
    'rate',
    CASE
      WHEN counts.active_n > 0 THEN
        ROUND((counts.activated_n::numeric / counts.active_n::numeric) * 100, 1)
      ELSE 0
    END,
    'total_mentees', counts.active_n
  )
  FROM counts;
$function$;
