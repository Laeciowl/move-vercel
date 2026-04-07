-- inactive_mentors in get_admin_alerts: do not count mentors with agenda disabled
CREATE OR REPLACE FUNCTION public.get_admin_alerts()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'pending_48h', (
      SELECT COUNT(*)::integer
      FROM public.mentor_sessions
      WHERE status = 'scheduled'
        AND confirmed_by_mentor = false
        AND created_at < NOW() - interval '48 hours'
        AND scheduled_at > NOW()
    ),
    'inactive_mentors', (
      SELECT COUNT(*)::integer
      FROM public.mentors m
      WHERE m.status = 'approved'
        AND COALESCE(m.temporarily_unavailable, false) = false
        AND NOT EXISTS (
          SELECT 1 FROM public.mentor_sessions ms
          WHERE ms.mentor_id = m.id
            AND ms.created_at > NOW() - interval '30 days'
        )
    ),
    'avg_mentorships_per_mentee', (
      SELECT COALESCE(ROUND(AVG(cnt)::numeric, 1), 0)
      FROM (
        SELECT COUNT(*)::numeric as cnt
        FROM public.mentor_sessions
        WHERE status = 'completed'
        GROUP BY user_id
      ) sub
    ),
    'mentor_to_mentee_ratio', (
      SELECT CASE
        WHEN (SELECT COUNT(*) FROM public.mentors WHERE status = 'approved') > 0
        THEN ROUND(
          (SELECT COUNT(*)::numeric FROM public.profiles) /
          (SELECT COUNT(*)::numeric FROM public.mentors WHERE status = 'approved'), 1
        )
        ELSE 0
      END
    )
  );
$function$;
