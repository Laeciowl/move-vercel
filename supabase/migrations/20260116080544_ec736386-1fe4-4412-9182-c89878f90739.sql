-- Add 'voluntario' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'voluntario';

-- Add status column to volunteer_applications to track approval
ALTER TABLE public.volunteer_applications 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';

-- Add user_id to volunteer_applications for linking with auth
ALTER TABLE public.volunteer_applications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_user_id ON public.volunteer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON public.volunteer_applications(status);