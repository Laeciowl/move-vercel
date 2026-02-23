
-- Add column to track Google Calendar event IDs for mentor and mentee
ALTER TABLE public.mentor_sessions 
  ADD COLUMN IF NOT EXISTS google_calendar_event_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_calendar_mentee_event_id text DEFAULT NULL;

COMMENT ON COLUMN public.mentor_sessions.google_calendar_event_id IS 'Google Calendar event ID for the mentor';
COMMENT ON COLUMN public.mentor_sessions.google_calendar_mentee_event_id IS 'Google Calendar event ID for the mentee';
