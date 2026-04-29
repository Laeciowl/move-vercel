DO $$
BEGIN
  ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_validate_session_schedule;
  ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_prevent_session_overlap;

  UPDATE public.mentor_sessions
  SET scheduled_at = NOW() + INTERVAL '4 hours'
  WHERE mentor_notes = '[TESTE_RECONF_4H]'
    AND status = 'scheduled';

  ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
  ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_prevent_session_overlap;
EXCEPTION
  WHEN OTHERS THEN
    ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
    ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_prevent_session_overlap;
    RAISE;
END $$;

SELECT id, scheduled_at, reconfirmation_sent, reconfirmation_sent_at, reconfirmation_confirmed, status
FROM public.mentor_sessions
WHERE mentor_notes = '[TESTE_RECONF_4H]'
ORDER BY created_at DESC
LIMIT 1;
