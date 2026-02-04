-- Create a function to get sessions completed count per mentor
-- A session is considered completed when its end time has passed and it wasn't cancelled
CREATE OR REPLACE FUNCTION public.get_mentor_sessions_completed_count(_mentor_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.mentor_id = _mentor_id
    AND ms.status = 'scheduled'
    AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW();
$$;

-- Create a function to get total platform completed sessions
CREATE OR REPLACE FUNCTION public.get_total_completed_sessions()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.status = 'scheduled'
    AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW();
$$;

-- Create a function to get future scheduled sessions count
CREATE OR REPLACE FUNCTION public.get_future_scheduled_sessions()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.status = 'scheduled'
    AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) >= NOW();
$$;