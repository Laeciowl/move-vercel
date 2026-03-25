
ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_validate_session_schedule;

UPDATE public.mentor_sessions 
SET status = 'scheduled'
WHERE id IN ('62436828-54f5-4bd2-814b-f5cb1f8c78f3', '5427d1ac-e30c-44b3-95c9-b86c3eed0c71');

ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
