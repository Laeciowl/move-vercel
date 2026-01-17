-- Add email notification preference to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;

-- Add comment explaining the field
COMMENT ON COLUMN public.profiles.email_notifications IS 'User preference for receiving marketing/promotional emails. Does not affect transactional emails.';