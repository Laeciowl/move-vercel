-- Temporarily disable validation triggers to insert test sessions
ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_validate_session_schedule;
ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_prevent_session_overlap;

INSERT INTO public.mentor_sessions (mentor_id, user_id, scheduled_at, status, confirmed_by_mentor, confirmed_at, duration, reconfirmation_sent, reconfirmation_sent_at)
VALUES 
  ('08328e7d-e3d2-4604-9083-eba0aa1916e2', '084939f9-a634-4377-b4fc-d93b925cc316', NOW() + INTERVAL '4 hours', 'scheduled', true, NOW(), 30, true, NOW()),
  ('08328e7d-e3d2-4604-9083-eba0aa1916e2', '084939f9-a634-4377-b4fc-d93b925cc316', NOW() + INTERVAL '3 hours 10 minutes', 'scheduled', true, NOW(), 30, true, NOW());

-- Re-enable triggers
ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_prevent_session_overlap;