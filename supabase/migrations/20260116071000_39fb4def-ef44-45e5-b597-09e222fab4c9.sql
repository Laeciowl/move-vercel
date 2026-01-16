-- Create mentor_blocked_periods table for vacation/personal blocks
CREATE TABLE public.mentor_blocked_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.mentor_blocked_periods ENABLE ROW LEVEL SECURITY;

-- Mentors can view all blocked periods (for scheduling visibility)
CREATE POLICY "Anyone can view blocked periods" 
ON public.mentor_blocked_periods 
FOR SELECT 
USING (true);

-- Mentors can manage their own blocked periods (using email match)
CREATE POLICY "Mentors can insert their own blocked periods" 
ON public.mentor_blocked_periods 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mentors m 
    WHERE m.id = mentor_id 
    AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Mentors can delete their own blocked periods" 
ON public.mentor_blocked_periods 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.mentors m 
    WHERE m.id = mentor_id 
    AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Add disclaimer_accepted column to mentors table
ALTER TABLE public.mentors 
ADD COLUMN disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN disclaimer_accepted_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX idx_mentor_blocked_periods_mentor_id ON public.mentor_blocked_periods(mentor_id);
CREATE INDEX idx_mentor_blocked_periods_dates ON public.mentor_blocked_periods(start_date, end_date);