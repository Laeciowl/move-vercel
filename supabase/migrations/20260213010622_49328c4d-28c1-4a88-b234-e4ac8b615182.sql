
-- Fix ALL RPC functions to use status = 'completed' instead of scheduled + past time

-- 1. get_public_mentors: use m.sessions_completed_count column directly
CREATE OR REPLACE FUNCTION public.get_public_mentors()
 RETURNS TABLE(id uuid, name text, area text, description text, education text, photo_url text, availability jsonb, min_advance_hours integer, sessions_completed_count integer, linkedin_url text, temporarily_unavailable boolean)
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
    m.sessions_completed_count AS sessions_completed_count,
    m.linkedin_url,
    m.temporarily_unavailable
  FROM public.mentors m
  WHERE m.status = 'approved'
  ORDER BY m.temporarily_unavailable ASC, m.sessions_completed_count DESC, m.created_at ASC;
END;
$function$;

-- 2. get_mentors_with_match: use m.sessions_completed_count column directly
CREATE OR REPLACE FUNCTION public.get_mentors_with_match(user_id_param uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, name text, area text, description text, education text, photo_url text, availability jsonb, min_advance_hours integer, sessions_completed_count integer, linkedin_url text, tags jsonb, match_count integer, matching_tags jsonb, temporarily_unavailable boolean)
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
    m.sessions_completed_count,
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
    m.sessions_completed_count DESC,
    m.created_at ASC;
END;
$function$;

-- 3. get_total_completed_sessions: count actual completed sessions
CREATE OR REPLACE FUNCTION public.get_total_completed_sessions()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.status = 'completed';
$function$;

-- 4. get_mentor_sessions_completed_count: count actual completed sessions
CREATE OR REPLACE FUNCTION public.get_mentor_sessions_completed_count(_mentor_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.mentor_id = _mentor_id
    AND ms.status = 'completed';
$function$;

-- 5. get_lives_impacted: count distinct mentees from completed sessions
CREATE OR REPLACE FUNCTION public.get_lives_impacted()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(COUNT(DISTINCT user_id)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.status = 'completed';
$function$;

-- 6. get_activation_rate: use completed status
CREATE OR REPLACE FUNCTION public.get_activation_rate()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    WHERE ms.status = 'completed'
  )
  SELECT jsonb_build_object(
    'total_mentees', (SELECT total FROM total_mentees),
    'activated', (SELECT total FROM activated),
    'rate', CASE WHEN (SELECT total FROM total_mentees) > 0 
      THEN ROUND(((SELECT total FROM activated)::numeric / (SELECT total FROM total_mentees)::numeric) * 100, 1)
      ELSE 0 END
  );
$function$;

-- 7. get_completion_rate: use completed status
CREATE OR REPLACE FUNCTION public.get_completion_rate()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH stats AS (
    SELECT 
      COUNT(*)::integer as total,
      COUNT(CASE WHEN status = 'completed' THEN 1 END)::integer as completed,
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
$function$;

-- 8. get_retention_rate: use completed status
CREATE OR REPLACE FUNCTION public.get_retention_rate()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH mentee_counts AS (
    SELECT user_id, COUNT(*)::integer as session_count
    FROM public.mentor_sessions
    WHERE status = 'completed'
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
$function$;

-- 9. get_monthly_growth: use completed status
CREATE OR REPLACE FUNCTION public.get_monthly_growth()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', NOW() - interval '5 months'),
      date_trunc('month', NOW()),
      interval '1 month'
    ) as month_start
  ),
  monthly_sessions AS (
    SELECT 
      date_trunc('month', completed_at) as month_start,
      COUNT(*)::integer as count
    FROM public.mentor_sessions
    WHERE status = 'completed'
      AND completed_at >= NOW() - interval '6 months'
    GROUP BY date_trunc('month', completed_at)
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
$function$;

-- 10. get_admin_alerts: fix pending count and inactive mentors
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

-- 11. get_future_scheduled_sessions: keep as-is but ensure it only counts truly future scheduled sessions
CREATE OR REPLACE FUNCTION public.get_future_scheduled_sessions()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.status = 'scheduled'
    AND ms.scheduled_at > NOW();
$function$;

-- 12. Fix the trigger to properly update sessions_completed_count based on completed status
CREATE OR REPLACE FUNCTION public.update_mentor_sessions_completed_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      UPDATE public.mentors SET sessions_completed_count = (
        SELECT COUNT(*) FROM public.mentor_sessions WHERE mentor_id = NEW.mentor_id AND status = 'completed'
      ) WHERE id = NEW.mentor_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status OR OLD.mentor_id IS DISTINCT FROM NEW.mentor_id THEN
      -- Recalculate for old mentor if changed
      IF OLD.mentor_id IS DISTINCT FROM NEW.mentor_id THEN
        UPDATE public.mentors SET sessions_completed_count = (
          SELECT COUNT(*) FROM public.mentor_sessions WHERE mentor_id = OLD.mentor_id AND status = 'completed'
        ) WHERE id = OLD.mentor_id;
      END IF;
      -- Recalculate for current mentor
      UPDATE public.mentors SET sessions_completed_count = (
        SELECT COUNT(*) FROM public.mentor_sessions WHERE mentor_id = NEW.mentor_id AND status = 'completed'
      ) WHERE id = NEW.mentor_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' THEN
      UPDATE public.mentors SET sessions_completed_count = (
        SELECT COUNT(*) FROM public.mentor_sessions WHERE mentor_id = OLD.mentor_id AND status = 'completed'
      ) WHERE id = OLD.mentor_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 13. Recalculate sessions_completed_count for ALL mentors based on actual completed sessions
UPDATE public.mentors m
SET sessions_completed_count = (
  SELECT COUNT(*)::integer
  FROM public.mentor_sessions ms
  WHERE ms.mentor_id = m.id
    AND ms.status = 'completed'
);
