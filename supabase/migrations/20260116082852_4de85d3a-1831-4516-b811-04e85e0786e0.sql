-- Create bug_reports table for user feedback
CREATE TABLE public.bug_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    page_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can create their own bug reports
CREATE POLICY "Users can create bug reports"
ON public.bug_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
ON public.bug_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all bug reports
CREATE POLICY "Admins can view all bug reports"
ON public.bug_reports
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update bug reports
CREATE POLICY "Admins can update bug reports"
ON public.bug_reports
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX idx_bug_reports_created_at ON public.bug_reports(created_at DESC);