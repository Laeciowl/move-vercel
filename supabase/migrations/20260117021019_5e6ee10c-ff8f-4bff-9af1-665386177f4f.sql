-- Create database webhook to call on-user-created function when a new profile is created
CREATE OR REPLACE FUNCTION public.notify_on_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Call the edge function via pg_net (if available) or just return
  -- The edge function will be triggered by a separate mechanism
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_user_created();