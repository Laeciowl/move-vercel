
-- Platform videos config (key-value for hero_video and onboarding_video)
CREATE TABLE public.platform_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  youtube_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.platform_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform videos" ON public.platform_videos
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage platform videos" ON public.platform_videos
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default entries
INSERT INTO public.platform_videos (key, youtube_url, title) VALUES
  ('hero_video', 'https://www.youtube.com/embed/9AoueBf7Tr0', 'Apresentação do Movê'),
  ('onboarding_video', '', 'Vídeo de Onboarding');

-- Onboarding quiz questions (admin-editable)
CREATE TABLE public.onboarding_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_option_index integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active questions" ON public.onboarding_questions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage questions" ON public.onboarding_questions
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Quiz attempts tracking
CREATE TABLE public.onboarding_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 5,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '[]',
  attempted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON public.onboarding_quiz_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON public.onboarding_quiz_attempts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts" ON public.onboarding_quiz_attempts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add onboarding_quiz_passed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_quiz_passed boolean NOT NULL DEFAULT false;
