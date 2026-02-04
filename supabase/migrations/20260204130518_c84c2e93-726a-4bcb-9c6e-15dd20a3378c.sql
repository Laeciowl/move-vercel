-- 1) Mentor configuration fields (antecedência, redes sociais, contador de sessões)
ALTER TABLE public.mentors
  ADD COLUMN IF NOT EXISTS min_advance_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS sessions_completed_count integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mentors_min_advance_hours_check'
  ) THEN
    ALTER TABLE public.mentors
      ADD CONSTRAINT mentors_min_advance_hours_check
      CHECK (min_advance_hours IN (12, 24, 48, 72));
  END IF;
END $$;

-- 2) Backfill sessions_completed_count from existing data
UPDATE public.mentors m
SET sessions_completed_count = COALESCE(s.cnt, 0)
FROM (
  SELECT mentor_id, COUNT(*)::int AS cnt
  FROM public.mentor_sessions
  WHERE status = 'completed'
  GROUP BY mentor_id
) s
WHERE s.mentor_id = m.id;

-- 3) Trigger para manter sessions_completed_count atualizado
CREATE OR REPLACE FUNCTION public.update_mentor_sessions_completed_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      UPDATE public.mentors SET sessions_completed_count = sessions_completed_count + 1 WHERE id = NEW.mentor_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.mentor_id IS DISTINCT FROM NEW.mentor_id THEN
      IF OLD.status = 'completed' THEN
        UPDATE public.mentors SET sessions_completed_count = GREATEST(sessions_completed_count - 1, 0) WHERE id = OLD.mentor_id;
      END IF;
      IF NEW.status = 'completed' THEN
        UPDATE public.mentors SET sessions_completed_count = sessions_completed_count + 1 WHERE id = NEW.mentor_id;
      END IF;
      RETURN NEW;
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF OLD.status = 'completed' THEN
        UPDATE public.mentors SET sessions_completed_count = GREATEST(sessions_completed_count - 1, 0) WHERE id = NEW.mentor_id;
      END IF;
      IF NEW.status = 'completed' THEN
        UPDATE public.mentors SET sessions_completed_count = sessions_completed_count + 1 WHERE id = NEW.mentor_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' THEN
      UPDATE public.mentors SET sessions_completed_count = GREATEST(sessions_completed_count - 1, 0) WHERE id = OLD.mentor_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_update_mentor_sessions_completed_count ON public.mentor_sessions;
CREATE TRIGGER tr_update_mentor_sessions_completed_count
AFTER INSERT OR UPDATE OR DELETE ON public.mentor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_mentor_sessions_completed_count();

-- 4) Cancelar duplicatas existentes (conflito de horário)
WITH ranked AS (
  SELECT id, mentor_id, scheduled_at,
    row_number() OVER (PARTITION BY mentor_id, scheduled_at ORDER BY confirmed_by_mentor DESC, created_at ASC) AS rn
  FROM public.mentor_sessions
  WHERE status = 'scheduled'
)
UPDATE public.mentor_sessions s
SET status = 'cancelled',
    mentor_notes = COALESCE(s.mentor_notes, '') || CASE WHEN COALESCE(s.mentor_notes, '') = '' THEN '' ELSE E'\n' END || 'Cancelado automaticamente (conflito de horário).'
FROM ranked r
WHERE s.id = r.id AND r.rn > 1;

-- 5) Validar antecedência mínima no backend
CREATE OR REPLACE FUNCTION public.validate_session_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  required_hours integer;
BEGIN
  IF NEW.status IS DISTINCT FROM 'scheduled' THEN
    RETURN NEW;
  END IF;
  SELECT m.min_advance_hours INTO required_hours FROM public.mentors m WHERE m.id = NEW.mentor_id;
  required_hours := COALESCE(required_hours, 24);
  IF NEW.scheduled_at < now() THEN
    RAISE EXCEPTION 'Horário inválido: escolha uma data futura.' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.scheduled_at < (now() + make_interval(hours => required_hours)) THEN
    RAISE EXCEPTION 'Agendamentos devem ser feitos com pelo menos % horas de antecedência.', required_hours USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_session_schedule ON public.mentor_sessions;
CREATE TRIGGER tr_validate_session_schedule
BEFORE INSERT OR UPDATE OF scheduled_at, mentor_id, status ON public.mentor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.validate_session_schedule();

-- 6) Evitar sobreposição de horário via trigger
CREATE OR REPLACE FUNCTION public.prevent_session_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conflict_count integer;
BEGIN
  IF NEW.status IS DISTINCT FROM 'scheduled' THEN
    RETURN NEW;
  END IF;
  SELECT COUNT(*) INTO conflict_count
  FROM public.mentor_sessions s
  WHERE s.mentor_id = NEW.mentor_id
    AND s.status = 'scheduled'
    AND s.id IS DISTINCT FROM NEW.id
    AND tstzrange(s.scheduled_at, s.scheduled_at + make_interval(mins => COALESCE(s.duration, 30)), '[)')
        && tstzrange(NEW.scheduled_at, NEW.scheduled_at + make_interval(mins => COALESCE(NEW.duration, 30)), '[)');
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Este horário já está ocupado. Escolha outro horário disponível.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_session_overlap ON public.mentor_sessions;
CREATE TRIGGER tr_prevent_session_overlap
BEFORE INSERT OR UPDATE OF scheduled_at, duration, mentor_id, status ON public.mentor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_session_overlap();

-- 7) Função segura para calendário: retorna slots ocupados sem user data
CREATE OR REPLACE FUNCTION public.get_mentor_booked_slots(_mentor_id uuid)
RETURNS TABLE (scheduled_at timestamptz, duration integer, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.scheduled_at, COALESCE(s.duration, 30) AS duration, s.status::text
  FROM public.mentor_sessions s
  WHERE s.mentor_id = _mentor_id AND s.status = 'scheduled';
$$;

GRANT EXECUTE ON FUNCTION public.get_mentor_booked_slots(uuid) TO anon, authenticated;

-- 8) Atualizar view pública com campos novos
DROP VIEW IF EXISTS public.mentors_public;
CREATE VIEW public.mentors_public AS
SELECT
  id, name, area, description, education, photo_url, availability, status,
  disclaimer_accepted, disclaimer_accepted_at, created_at,
  min_advance_hours, sessions_completed_count, linkedin_url
FROM public.mentors
WHERE status = 'approved'::mentor_status;