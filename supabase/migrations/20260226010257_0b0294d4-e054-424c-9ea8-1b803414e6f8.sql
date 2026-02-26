
-- Add columns to track which reminders have already been sent
ALTER TABLE public.mentor_sessions 
ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_1h_sent boolean NOT NULL DEFAULT false;
