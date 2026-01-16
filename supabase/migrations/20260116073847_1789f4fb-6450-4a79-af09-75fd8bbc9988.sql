-- Create enum for volunteer categories
CREATE TYPE public.volunteer_category AS ENUM ('aulas_lives', 'templates_arquivos', 'mentoria');

-- Create table for volunteer content submissions (pending admin approval)
CREATE TABLE public.volunteer_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id UUID REFERENCES public.volunteer_applications(id) ON DELETE CASCADE,
  volunteer_email TEXT NOT NULL,
  volunteer_name TEXT NOT NULL,
  category volunteer_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('link', 'file')),
  content_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.volunteer_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert submissions
CREATE POLICY "Anyone can submit content"
ON public.volunteer_submissions
FOR INSERT
WITH CHECK (true);

-- Policy: Only admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.volunteer_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Submitters can view their own submissions by email
CREATE POLICY "Submitters can view own submissions"
ON public.volunteer_submissions
FOR SELECT
USING (volunteer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

-- Policy: Only admins can update submissions (approve/reject)
CREATE POLICY "Admins can update submissions"
ON public.volunteer_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Only admins can delete submissions
CREATE POLICY "Admins can delete submissions"
ON public.volunteer_submissions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update volunteer_applications to use new categories
ALTER TABLE public.volunteer_applications 
ADD COLUMN categories TEXT[] DEFAULT '{}';

-- Add confirmed_by_mentor column to mentor_sessions for session confirmation
ALTER TABLE public.mentor_sessions 
ADD COLUMN confirmed_by_mentor BOOLEAN DEFAULT false,
ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN mentor_notes TEXT;

-- Policy: Mentors can view sessions where they are the mentor
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.mentor_sessions;

CREATE POLICY "Users and mentors can view sessions"
ON public.mentor_sessions
FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM mentors m 
    WHERE m.id = mentor_sessions.mentor_id 
    AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  )
);

-- Policy: Mentors can update sessions they are assigned to
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.mentor_sessions;

CREATE POLICY "Users and mentors can update sessions"
ON public.mentor_sessions
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM mentors m 
    WHERE m.id = mentor_sessions.mentor_id 
    AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  )
);

-- Create storage bucket for volunteer content files
INSERT INTO storage.buckets (id, name, public) VALUES ('volunteer-content', 'volunteer-content', true);

-- Storage policies for volunteer content
CREATE POLICY "Anyone can upload volunteer content"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'volunteer-content');

CREATE POLICY "Anyone can view volunteer content"
ON storage.objects
FOR SELECT
USING (bucket_id = 'volunteer-content');

CREATE POLICY "Admins can delete volunteer content"
ON storage.objects
FOR DELETE
USING (bucket_id = 'volunteer-content' AND has_role(auth.uid(), 'admin'::app_role));