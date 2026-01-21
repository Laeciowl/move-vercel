-- Add mentee formation and objective fields to mentor_sessions
ALTER TABLE public.mentor_sessions 
ADD COLUMN mentee_formation text,
ADD COLUMN mentee_objective text;