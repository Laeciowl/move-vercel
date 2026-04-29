-- Activation rate: % of *active* mentees (engaged) who completed at least 1 session.
-- Active = not approved mentor AND (quiz passed OR first booking flagged OR any session row).
-- Denominator was previously all non-mentor profiles (included "pendentes" who never engaged).

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
      JOIN auth.users au ON au.email = m.email
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
    -- compat: mesmo valor que active_mentees (denominador antigo era total mentorados)
    'total_mentees', counts.active_n
  )
  FROM counts;
$function$;
