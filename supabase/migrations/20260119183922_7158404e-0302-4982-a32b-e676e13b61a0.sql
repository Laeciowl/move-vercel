-- Add duration column to mentor_sessions table
ALTER TABLE public.mentor_sessions 
ADD COLUMN IF NOT EXISTS duration integer DEFAULT 30;

-- Add a comment to explain the column
COMMENT ON COLUMN public.mentor_sessions.duration IS 'Session duration in minutes (30, 45, or 60)';

-- Add completed_at timestamp to track when session was marked as completed
ALTER TABLE public.mentor_sessions 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;