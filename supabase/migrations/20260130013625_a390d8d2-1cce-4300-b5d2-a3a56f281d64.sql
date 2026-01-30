-- Add onboarding_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Add has_booked_mentorship field to track first mentorship booking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_mentorship_booked boolean NOT NULL DEFAULT false;

-- Create a trigger to automatically set first_mentorship_booked when user books their first session
CREATE OR REPLACE FUNCTION public.mark_first_mentorship_booked()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's profile to mark first mentorship as booked
  UPDATE public.profiles 
  SET first_mentorship_booked = true 
  WHERE user_id = NEW.user_id 
    AND first_mentorship_booked = false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on mentor_sessions table
DROP TRIGGER IF EXISTS on_first_mentorship_booked ON public.mentor_sessions;
CREATE TRIGGER on_first_mentorship_booked
AFTER INSERT ON public.mentor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.mark_first_mentorship_booked();