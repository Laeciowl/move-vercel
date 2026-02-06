
-- Table for mentors to pick up to 4 featured achievements
CREATE TABLE public.mentor_featured_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentor_id, achievement_id),
  CONSTRAINT max_display_order CHECK (display_order BETWEEN 1 AND 4)
);

-- RLS
ALTER TABLE public.mentor_featured_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public visibility on mentor cards)
CREATE POLICY "Featured achievements are publicly readable"
ON public.mentor_featured_achievements FOR SELECT USING (true);

-- Mentors can manage their own featured achievements
CREATE POLICY "Mentors can insert own featured achievements"
ON public.mentor_featured_achievements FOR INSERT
WITH CHECK (
  mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.email = public.current_user_email())
);

CREATE POLICY "Mentors can update own featured achievements"
ON public.mentor_featured_achievements FOR UPDATE
USING (
  mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.email = public.current_user_email())
);

CREATE POLICY "Mentors can delete own featured achievements"
ON public.mentor_featured_achievements FOR DELETE
USING (
  mentor_id IN (SELECT m.id FROM public.mentors m WHERE m.email = public.current_user_email())
);

-- Admins can manage all
CREATE POLICY "Admins can manage all featured achievements"
ON public.mentor_featured_achievements FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RPC to get featured achievements for multiple mentors (public)
CREATE OR REPLACE FUNCTION public.get_mentor_featured_achievements(mentor_ids uuid[])
RETURNS TABLE(mentor_id uuid, achievement_id uuid, icon text, achievement_name text, description text, display_order integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    mfa.mentor_id,
    a.id as achievement_id,
    a.icon,
    a.name as achievement_name,
    a.description,
    mfa.display_order
  FROM public.mentor_featured_achievements mfa
  JOIN public.achievements a ON a.id = mfa.achievement_id
  WHERE mfa.mentor_id = ANY(mentor_ids)
    AND a.active = true
  ORDER BY mfa.mentor_id, mfa.display_order ASC;
$$;
