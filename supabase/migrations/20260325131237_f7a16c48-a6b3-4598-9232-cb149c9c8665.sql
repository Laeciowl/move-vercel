
-- Attendance status enum
CREATE TYPE public.attendance_status AS ENUM (
  'realizada',
  'no_show_mentorado',
  'no_show_mentor',
  'cancelada_mentorado',
  'cancelada_mentor',
  'reagendada'
);

-- Penalty status enum
CREATE TYPE public.penalty_status AS ENUM (
  'ativo',
  'aviso_1',
  'bloqueado_7d',
  'bloqueado_30d',
  'banido'
);

-- Add reconfirmation columns to mentor_sessions
ALTER TABLE public.mentor_sessions
  ADD COLUMN reconfirmation_sent BOOLEAN DEFAULT false,
  ADD COLUMN reconfirmation_sent_at TIMESTAMPTZ,
  ADD COLUMN reconfirmation_confirmed BOOLEAN,
  ADD COLUMN reconfirmation_confirmed_at TIMESTAMPTZ;

-- Mentee attendance table
CREATE TABLE public.mentee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mentor_sessions(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL,
  mentee_user_id UUID NOT NULL,
  status public.attendance_status NOT NULL,
  mentee_avisou BOOLEAN DEFAULT false,
  mentor_observations TEXT,
  reported_at TIMESTAMPTZ DEFAULT now(),
  reported_by UUID NOT NULL,
  UNIQUE(session_id)
);

ALTER TABLE public.mentee_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can report attendance"
  ON public.mentee_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    mentor_id IN (SELECT id FROM public.mentors WHERE email = current_user_email())
  );

CREATE POLICY "Mentors can view own session attendance"
  ON public.mentee_attendance FOR SELECT
  TO authenticated
  USING (
    mentor_id IN (SELECT id FROM public.mentors WHERE email = current_user_email())
    OR mentee_user_id = auth.uid()
  );

CREATE POLICY "Admins can manage all attendance"
  ON public.mentee_attendance FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Mentee penalties table
CREATE TABLE public.mentee_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_no_shows INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  status public.penalty_status DEFAULT 'ativo',
  blocked_until TIMESTAMPTZ,
  block_reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mentee_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own penalties"
  ON public.mentee_penalties FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all penalties"
  ON public.mentee_penalties FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Mentors can view mentee penalties"
  ON public.mentee_penalties FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentor_sessions ms
      JOIN public.mentors m ON m.id = ms.mentor_id
      WHERE ms.user_id = mentee_penalties.user_id
      AND m.email = current_user_email()
    )
  );

-- Trigger function to auto-escalate penalties on attendance insert
CREATE OR REPLACE FUNCTION public.update_mentee_penalties()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_penalty RECORD;
  new_status public.penalty_status;
  block_date TIMESTAMPTZ;
  new_no_shows INTEGER;
BEGIN
  -- If session was completed, increment completed count
  IF NEW.status = 'realizada' THEN
    INSERT INTO public.mentee_penalties (user_id, total_completed)
    VALUES (NEW.mentee_user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET total_completed = mentee_penalties.total_completed + 1,
        updated_at = now();
    RETURN NEW;
  END IF;

  -- Only punish no-shows without advance notice
  IF NEW.status != 'no_show_mentorado' OR NEW.mentee_avisou = true THEN
    RETURN NEW;
  END IF;

  -- Get or create penalty record
  SELECT * INTO current_penalty FROM public.mentee_penalties WHERE user_id = NEW.mentee_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.mentee_penalties (user_id, total_no_shows, status, block_reason)
    VALUES (NEW.mentee_user_id, 1, 'aviso_1', 'No-show sem aviso prévio - falta #1');
    RETURN NEW;
  END IF;

  new_no_shows := current_penalty.total_no_shows + 1;

  IF new_no_shows = 1 THEN
    new_status := 'aviso_1';
    block_date := NULL;
  ELSIF new_no_shows = 2 THEN
    new_status := 'bloqueado_7d';
    block_date := now() + interval '7 days';
  ELSIF new_no_shows = 3 THEN
    new_status := 'bloqueado_30d';
    block_date := now() + interval '30 days';
  ELSE
    new_status := 'banido';
    block_date := NULL;
  END IF;

  UPDATE public.mentee_penalties
  SET total_no_shows = new_no_shows,
      status = new_status,
      blocked_until = block_date,
      block_reason = 'No-show automático - falta #' || new_no_shows,
      updated_at = now()
  WHERE user_id = NEW.mentee_user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_mentee_penalties
AFTER INSERT ON public.mentee_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_mentee_penalties();

-- Function to get mentee attendance stats (used by mentors and UI)
CREATE OR REPLACE FUNCTION public.get_mentee_attendance_stats(mentee_id UUID)
RETURNS TABLE(
  total_completed INTEGER,
  total_no_shows INTEGER,
  attendance_rate NUMERIC,
  penalty_status TEXT,
  blocked_until TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(mp.total_completed, 0)::INTEGER as total_completed,
    COALESCE(mp.total_no_shows, 0)::INTEGER as total_no_shows,
    CASE WHEN COALESCE(mp.total_completed, 0) + COALESCE(mp.total_no_shows, 0) > 0
      THEN ROUND(
        (COALESCE(mp.total_completed, 0)::numeric /
          (COALESCE(mp.total_completed, 0) + COALESCE(mp.total_no_shows, 0))::numeric) * 100, 1
      )
      ELSE 100
    END as attendance_rate,
    mp.status::text as penalty_status,
    mp.blocked_until
  FROM public.mentee_penalties mp
  WHERE mp.user_id = mentee_id
  UNION ALL
  SELECT 0, 0, 100, 'ativo', NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.mentee_penalties WHERE user_id = mentee_id)
  LIMIT 1;
$$;
