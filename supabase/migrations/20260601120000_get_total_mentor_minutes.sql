-- Total minutes mentored across the whole platform ("minutos que mudaram o mundo").
-- Sums the duration of every COMPLETED mentor session. Mirrors the app's per-session
-- default of 30 minutes (see VolunteerPanel.tsx and the mentor_sessions duration default),
-- so legacy rows with a NULL duration still count as 30.
-- Follows the same shape as get_total_completed_sessions(): sql / STABLE / SECURITY DEFINER,
-- and relies on the default PUBLIC execute grant like the other public stat RPCs.

CREATE OR REPLACE FUNCTION public.get_total_mentor_minutes()
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(COALESCE(ms.duration, 30))::integer, 0)
  FROM public.mentor_sessions ms
  WHERE ms.status = 'completed';
$function$;
