-- Create function to get unique mentees with completed sessions (lives impacted)
CREATE OR REPLACE FUNCTION public.get_lives_impacted()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(COUNT(DISTINCT user_id)::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.status = 'scheduled'
    AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW();
$function$;