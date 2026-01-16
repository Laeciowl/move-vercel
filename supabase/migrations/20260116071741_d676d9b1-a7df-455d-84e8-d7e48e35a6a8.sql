-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix volunteer_applications: restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can view volunteer applications" ON public.volunteer_applications;

CREATE POLICY "Only admins can view volunteer applications"
  ON public.volunteer_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create public view for mentors (excludes email)
CREATE VIEW public.mentors_public AS
  SELECT id, name, area, description, education, photo_url, availability, status, disclaimer_accepted, disclaimer_accepted_at, created_at
  FROM public.mentors
  WHERE status = 'approved';

-- Fix profiles INSERT policy
DROP POLICY IF EXISTS "Allow profile creation" ON public.profiles;

CREATE POLICY "Users can only create their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix notifications INSERT policy - only service role/system
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

-- Add mentor UPDATE policy so mentors can update their own profile
CREATE POLICY "Mentors can update their own profile"
  ON public.mentors FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));