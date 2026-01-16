-- Create mentor status enum
CREATE TYPE public.mentor_status AS ENUM ('pending', 'approved', 'rejected');

-- Create session status enum  
CREATE TYPE public.session_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Create mentors table
CREATE TABLE public.mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  description TEXT NOT NULL,
  education TEXT,
  photo_url TEXT,
  availability JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.mentor_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on mentors
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved mentors
CREATE POLICY "Anyone can view approved mentors"
ON public.mentors
FOR SELECT
USING (status = 'approved');

-- Anyone can apply to be a mentor (insert)
CREATE POLICY "Anyone can apply to be a mentor"
ON public.mentors
FOR INSERT
WITH CHECK (true);

-- Create mentor_sessions table
CREATE TABLE public.mentor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status public.session_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on mentor_sessions
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.mentor_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create sessions
CREATE POLICY "Users can create sessions"
ON public.mentor_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions (cancel)
CREATE POLICY "Users can update their own sessions"
ON public.mentor_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create storage bucket for mentor photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentor-photos', 'mentor-photos', true);

-- Storage policies for mentor photos
CREATE POLICY "Anyone can view mentor photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'mentor-photos');

CREATE POLICY "Anyone can upload mentor photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'mentor-photos');

-- Add trigger for updated_at on mentors
CREATE TRIGGER update_mentors_updated_at
BEFORE UPDATE ON public.mentors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();