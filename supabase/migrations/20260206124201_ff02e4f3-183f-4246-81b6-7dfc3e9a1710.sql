
-- Table for mentor notes about mentees
CREATE TABLE public.mentor_mentee_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  mentee_user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_mentor_mentee_notes_unique ON public.mentor_mentee_notes(mentor_id, mentee_user_id);
CREATE INDEX idx_mentor_mentee_notes_mentor ON public.mentor_mentee_notes(mentor_id);

ALTER TABLE public.mentor_mentee_notes ENABLE ROW LEVEL SECURITY;

-- Only the mentor who owns the note can read/write
CREATE POLICY "Mentors can view their own notes"
  ON public.mentor_mentee_notes FOR SELECT
  USING (mentor_id IN (SELECT id FROM public.mentors WHERE email = public.current_user_email()));

CREATE POLICY "Mentors can create their own notes"
  ON public.mentor_mentee_notes FOR INSERT
  WITH CHECK (mentor_id IN (SELECT id FROM public.mentors WHERE email = public.current_user_email()));

CREATE POLICY "Mentors can update their own notes"
  ON public.mentor_mentee_notes FOR UPDATE
  USING (mentor_id IN (SELECT id FROM public.mentors WHERE email = public.current_user_email()));

CREATE POLICY "Mentors can delete their own notes"
  ON public.mentor_mentee_notes FOR DELETE
  USING (mentor_id IN (SELECT id FROM public.mentors WHERE email = public.current_user_email()));

-- Trigger for updated_at
CREATE TRIGGER update_mentor_mentee_notes_updated_at
  BEFORE UPDATE ON public.mentor_mentee_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
