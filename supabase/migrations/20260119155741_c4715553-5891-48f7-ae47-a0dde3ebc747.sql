-- Fix mentor applications - require authentication
REVOKE INSERT ON public.mentors FROM anon;

-- Update mentor insert policy to require authenticated users
DROP POLICY IF EXISTS "Public mentor applications" ON public.mentors;

CREATE POLICY "Authenticated users can apply to be mentor"
ON public.mentors FOR INSERT TO authenticated
WITH CHECK (email = public.current_user_email());

-- Ensure notifications only inserted by system triggers
DROP POLICY IF EXISTS "Only system can insert notifications" ON public.notifications;
CREATE POLICY "Only system can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (false);