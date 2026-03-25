ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_validate_session_schedule;
ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_prevent_session_overlap;
UPDATE public.mentor_sessions SET reconfirmation_sent = false, reconfirmation_sent_at = NULL, scheduled_at = NOW() + INTERVAL '6 hours' WHERE id = '9910d8cc-7dd3-4f63-8f94-4531f6b5cb32';
ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_prevent_session_overlap;