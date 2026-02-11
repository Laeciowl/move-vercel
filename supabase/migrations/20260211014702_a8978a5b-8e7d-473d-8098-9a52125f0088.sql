
-- Activation rate: % of mentees who had at least 1 completed session
CREATE OR REPLACE FUNCTION public.get_activation_rate()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH total_mentees AS (
    SELECT COUNT(*)::integer as total
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.mentors m 
      JOIN auth.users au ON au.email = m.email 
      WHERE au.id = p.user_id AND m.status = 'approved'
    )
  ),
  activated AS (
    SELECT COUNT(DISTINCT ms.user_id)::integer as total
    FROM public.mentor_sessions ms
    WHERE ms.status = 'scheduled'
      AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW()
  )
  SELECT jsonb_build_object(
    'total_mentees', (SELECT total FROM total_mentees),
    'activated', (SELECT total FROM activated),
    'rate', CASE WHEN (SELECT total FROM total_mentees) > 0 
      THEN ROUND(((SELECT total FROM activated)::numeric / (SELECT total FROM total_mentees)::numeric) * 100, 1)
      ELSE 0 END
  );
$$;

-- Confirmation rate: % of scheduled sessions that were confirmed by mentor
CREATE OR REPLACE FUNCTION public.get_confirmation_rate()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COUNT(CASE WHEN confirmed_by_mentor = true THEN 1 END)::integer as confirmed
    FROM public.mentor_sessions
    WHERE status = 'scheduled'
  )
  SELECT jsonb_build_object(
    'total', total,
    'confirmed', confirmed,
    'rate', CASE WHEN total > 0 THEN ROUND((confirmed::numeric / total::numeric) * 100, 1) ELSE 0 END
  )
  FROM stats;
$$;

-- Completion rate: % of sessions past their time (completed)
CREATE OR REPLACE FUNCTION public.get_completion_rate()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COUNT(CASE WHEN status = 'scheduled' AND (scheduled_at + make_interval(mins => COALESCE(duration, 30))) < NOW() THEN 1 END)::integer as completed,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::integer as cancelled
    FROM public.mentor_sessions
  )
  SELECT jsonb_build_object(
    'total', total,
    'completed', completed,
    'cancelled', cancelled,
    'rate', CASE WHEN total > 0 THEN ROUND((completed::numeric / total::numeric) * 100, 1) ELSE 0 END
  )
  FROM stats;
$$;

-- Retention rate: % of mentees who come back for 2nd mentorship
CREATE OR REPLACE FUNCTION public.get_retention_rate()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH mentee_counts AS (
    SELECT user_id, COUNT(*)::integer as session_count
    FROM public.mentor_sessions
    WHERE status = 'scheduled'
      AND (scheduled_at + make_interval(mins => COALESCE(duration, 30))) < NOW()
    GROUP BY user_id
  ),
  stats AS (
    SELECT 
      COUNT(*)::integer as total_with_sessions,
      COUNT(CASE WHEN session_count >= 2 THEN 1 END)::integer as retained
    FROM mentee_counts
  )
  SELECT jsonb_build_object(
    'total', total_with_sessions,
    'retained', retained,
    'rate', CASE WHEN total_with_sessions > 0 THEN ROUND((retained::numeric / total_with_sessions::numeric) * 100, 1) ELSE 0 END
  )
  FROM stats;
$$;

-- Monthly growth data (last 6 months)
CREATE OR REPLACE FUNCTION public.get_monthly_growth()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', NOW() - interval '5 months'),
      date_trunc('month', NOW()),
      interval '1 month'
    ) as month_start
  ),
  monthly_sessions AS (
    SELECT 
      date_trunc('month', scheduled_at) as month_start,
      COUNT(*)::integer as count
    FROM public.mentor_sessions
    WHERE status = 'scheduled'
      AND (scheduled_at + make_interval(mins => COALESCE(duration, 30))) < NOW()
      AND scheduled_at >= NOW() - interval '6 months'
    GROUP BY date_trunc('month', scheduled_at)
  ),
  monthly_mentors AS (
    SELECT 
      date_trunc('month', created_at) as month_start,
      COUNT(*)::integer as count
    FROM public.mentors
    WHERE status = 'approved'
      AND created_at >= NOW() - interval '6 months'
    GROUP BY date_trunc('month', created_at)
  ),
  monthly_mentees AS (
    SELECT 
      date_trunc('month', created_at) as month_start,
      COUNT(*)::integer as count
    FROM public.profiles
    WHERE created_at >= NOW() - interval '6 months'
    GROUP BY date_trunc('month', created_at)
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', to_char(m.month_start, 'Mon'),
      'month_num', EXTRACT(MONTH FROM m.month_start)::integer,
      'sessions', COALESCE(ms.count, 0),
      'new_mentors', COALESCE(mm.count, 0),
      'new_mentees', COALESCE(me.count, 0)
    ) ORDER BY m.month_start
  )
  FROM months m
  LEFT JOIN monthly_sessions ms ON ms.month_start = m.month_start
  LEFT JOIN monthly_mentors mm ON mm.month_start = m.month_start
  LEFT JOIN monthly_mentees me ON me.month_start = m.month_start;
$$;

-- Alerts: pending sessions >48h, inactive mentors, etc
CREATE OR REPLACE FUNCTION public.get_admin_alerts()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
        WHERE status = 'scheduled'
          AND (scheduled_at + make_interval(mins => COALESCE(duration, 30))) < NOW()
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
$$;

-- Grant execute permissions to authenticated users (admin check is at app level)
GRANT EXECUTE ON FUNCTION public.get_activation_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_confirmation_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_completion_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_retention_rate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_growth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_alerts() TO authenticated;
