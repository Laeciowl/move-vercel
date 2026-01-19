-- Add area and theme columns to volunteer_submissions for filtering
ALTER TABLE public.volunteer_submissions 
ADD COLUMN IF NOT EXISTS area text DEFAULT 'geral';

ALTER TABLE public.volunteer_submissions 
ADD COLUMN IF NOT EXISTS tema text DEFAULT 'geral';