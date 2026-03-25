
ALTER TABLE public.mentor_sessions DISABLE TRIGGER tr_validate_session_schedule;

UPDATE public.mentor_sessions 
SET scheduled_at = (NOW() + interval '3 hours 10 minutes')::timestamptz
WHERE id = 'da8db345-de1a-4010-a7e5-c0efdade20e4';

ALTER TABLE public.mentor_sessions ENABLE TRIGGER tr_validate_session_schedule;
