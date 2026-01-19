-- Create session_reviews table for mentee reviews
CREATE TABLE public.session_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.mentor_sessions(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.session_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reviews for their own completed sessions
CREATE POLICY "Users can create reviews for their sessions"
ON public.session_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own reviews
CREATE POLICY "Users can view their own reviews"
ON public.session_reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Everyone can read reviews (for mentor profile)
CREATE POLICY "Anyone can read reviews"
ON public.session_reviews
FOR SELECT
USING (true);

-- Create index for faster queries
CREATE INDEX idx_session_reviews_mentor_id ON public.session_reviews(mentor_id);
CREATE INDEX idx_session_reviews_session_id ON public.session_reviews(session_id);