-- =============================================================================
-- Teste no ambiente LOCAL (npm run dev): não depende de commit nem deploy.
-- O Vite lê VITE_SUPABASE_URL do .env — em geral é o MESMO projeto do painel
-- Supabase. Rodar ESTE arquivo no SQL Editor desse projeto já faz a sessão
-- aparecer no app aberto em localhost.
--
-- Uso: Supabase Dashboard → SQL Editor (role com acesso a auth.users + public).
-- Cria mentoria já encerrada (horário + duração no passado) entre:
--   mentorado: laeciooliveira2002@hotmail.com
--   mentor:    laeciooliveira2002@gmail.com
-- Sem mentee_attendance → aparece em "Confirmar comparecimento" para o mentor.
-- Apaga sessões anteriores com nota [TESTE_MANUAL_CHECK].
-- =============================================================================

DO $$
DECLARE
  v_mentor_id uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_mentor_id
  FROM public.mentors
  WHERE email = 'laeciooliveira2002@gmail.com'
  LIMIT 1;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'laeciooliveira2002@hotmail.com'
  LIMIT 1;

  IF v_mentor_id IS NULL THEN
    RAISE EXCEPTION 'Mentor não encontrado: laeciooliveira2002@gmail.com';
  END IF;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário mentorado não encontrado em auth.users: laeciooliveira2002@hotmail.com';
  END IF;

  DELETE FROM public.mentor_sessions
  WHERE mentor_notes = '[TESTE_MANUAL_CHECK]';

  ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_validate_session_schedule;
  ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_prevent_session_overlap;

  INSERT INTO public.mentor_sessions (
    mentor_id,
    user_id,
    scheduled_at,
    status,
    confirmed_by_mentor,
    confirmed_at,
    duration,
    reconfirmation_sent,
    reconfirmation_sent_at,
    reconfirmation_confirmed,
    reconfirmation_confirmed_at,
    mentor_notes,
    reminder_1h_sent,
    reminder_24h_sent
  )
  VALUES (
    v_mentor_id,
    v_user_id,
    NOW() - INTERVAL '4 hours',
    'scheduled',
    true,
    NOW() - INTERVAL '7 days',
    30,
    true,
    NOW() - INTERVAL '2 days',
    true,
    NOW() - INTERVAL '2 days',
    '[TESTE_MANUAL_CHECK]',
    true,
    true
  );

  ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
  ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_prevent_session_overlap;

EXCEPTION
  WHEN OTHERS THEN
    ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
    ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_prevent_session_overlap;
    RAISE;
END $$;
