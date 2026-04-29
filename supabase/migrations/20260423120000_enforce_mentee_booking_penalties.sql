-- Impede novo agendamento quando mentorado está banido ou em período de bloqueio por no-show.
CREATE OR REPLACE FUNCTION public.enforce_mentee_can_book_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p public.mentee_penalties%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.mentee_penalties WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF p.status = 'banido' THEN
    RAISE EXCEPTION 'Sua conta não pode agendar mentorias no momento. Entre em contato pelo suporte (movecarreiras@gmail.com).'
      USING ERRCODE = 'P0001';
  END IF;

  IF p.status IN ('bloqueado_7d', 'bloqueado_30d')
     AND p.blocked_until IS NOT NULL
     AND p.blocked_until > NOW() THEN
    RAISE EXCEPTION 'Agendamento suspenso até % (faltas sem aviso prévio).',
      to_char(p.blocked_until AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI')
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_mentee_can_book_session ON public.mentor_sessions;

CREATE TRIGGER tr_enforce_mentee_can_book_session
BEFORE INSERT ON public.mentor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_mentee_can_book_session();

-- Impede confirmar reconfirmação após o prazo (3h antes do início), mesmo via API/cliente direto.
CREATE OR REPLACE FUNCTION public.enforce_mentee_reconfirmation_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reconfirmation_confirmed IS TRUE
     AND (OLD.reconfirmation_confirmed IS DISTINCT FROM TRUE)
     AND NEW.status = 'scheduled'
     AND COALESCE(NEW.confirmed_by_mentor, false) = true
  THEN
    IF (NEW.scheduled_at - clock_timestamp()) <= interval '3 hours' THEN
      RAISE EXCEPTION 'Prazo para reconfirmar presença encerrou (é preciso confirmar com mais de 3 horas de antecedência ao horário da sessão).' USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_mentee_reconfirmation_deadline ON public.mentor_sessions;

CREATE TRIGGER tr_enforce_mentee_reconfirmation_deadline
BEFORE UPDATE ON public.mentor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_mentee_reconfirmation_deadline();
