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
    RAISE EXCEPTION 'Mentor não encontrado';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Mentorado não encontrado';
  END IF;

  -- Ensure test scenario uses the new default behavior (no auto cancel).
  UPDATE public.mentors
  SET auto_cancel_no_reconfirmation = false
  WHERE id = v_mentor_id;

  DELETE FROM public.mentor_sessions
  WHERE mentor_notes = '[TESTE_RECONF_4H]';

  ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_validate_session_schedule;
  ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_prevent_session_overlap;

  -- Create in 6h window to trigger reconfirmation email.
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
  ) VALUES (
    v_mentor_id,
    v_user_id,
    NOW() + INTERVAL '6 hours 5 minutes',
    'scheduled',
    true,
    NOW(),
    30,
    false,
    NULL,
    NULL,
    NULL,
    '[TESTE_RECONF_4H]',
    false,
    false
  );

  ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
  ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_prevent_session_overlap;
EXCEPTION
  WHEN OTHERS THEN
    ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
    ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_prevent_session_overlap;
    RAISE;
END $$;
