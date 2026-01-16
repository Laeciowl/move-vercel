-- Create enums for professional status and income range
CREATE TYPE public.professional_status AS ENUM (
  'desempregado',
  'estudante',
  'estagiario',
  'empregado',
  'freelancer_pj'
);

CREATE TYPE public.income_range AS ENUM (
  'sem_renda',
  'ate_1500',
  '1500_3000',
  'acima_3000'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  professional_status professional_status NOT NULL,
  income_range income_range NOT NULL,
  lgpd_consent BOOLEAN NOT NULL DEFAULT false,
  lgpd_consent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create impact history table for tracking user progress
CREATE TABLE public.impact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_status professional_status NOT NULL,
  income_range income_range NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteer applications table
CREATE TABLE public.volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  area TEXT NOT NULL,
  how_to_help TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content items table
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('pdf', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user owns the profile
CREATE OR REPLACE FUNCTION public.is_own_profile(profile_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = profile_user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (is_own_profile(user_id));

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND lgpd_consent = true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (is_own_profile(user_id))
WITH CHECK (is_own_profile(user_id));

-- RLS Policies for impact_history
CREATE POLICY "Users can view their own impact history"
ON public.impact_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own impact history"
ON public.impact_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for volunteer_applications (public insert)
CREATE POLICY "Anyone can submit volunteer application"
ON public.volunteer_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view volunteer applications"
ON public.volunteer_applications FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for content_items (authenticated read only)
CREATE POLICY "Authenticated users can view content"
ON public.content_items FOR SELECT
TO authenticated
USING (true);

-- Trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to automatically create impact history when profile status changes
CREATE OR REPLACE FUNCTION public.track_impact_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.professional_status IS DISTINCT FROM NEW.professional_status 
     OR OLD.income_range IS DISTINCT FROM NEW.income_range THEN
    INSERT INTO public.impact_history (user_id, professional_status, income_range)
    VALUES (NEW.user_id, NEW.professional_status, NEW.income_range);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER track_profile_impact_change
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.track_impact_change();

-- Trigger to create initial impact history on profile creation
CREATE OR REPLACE FUNCTION public.create_initial_impact_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.impact_history (user_id, professional_status, income_range)
  VALUES (NEW.user_id, NEW.professional_status, NEW.income_range);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;