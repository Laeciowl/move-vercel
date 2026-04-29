-- Cleanup test account and fix legacy cancellation note attribution.
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'teste@teste.com';
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Keep order defensive for non-cascading relations.
    DELETE FROM public.referrals WHERE referrer_id = v_user_id OR referred_user_id = v_user_id;
    DELETE FROM public.onboarding_quiz_attempts WHERE user_id = v_user_id;
    DELETE FROM public.nps_respostas WHERE user_id = v_user_id;
    DELETE FROM public.mentee_interests WHERE user_id = v_user_id;
    DELETE FROM public.mentee_penalties WHERE user_id = v_user_id;
    DELETE FROM public.user_achievements WHERE user_id = v_user_id;
    DELETE FROM public.content_access_log WHERE user_id = v_user_id;
    DELETE FROM public.content_saves WHERE user_id = v_user_id;
    DELETE FROM public.google_calendar_tokens WHERE user_id = v_user_id;
    DELETE FROM public.mentor_mentee_notes WHERE mentee_user_id = v_user_id;
    DELETE FROM public.planos_desenvolvimento WHERE mentorado_id = v_user_id;
    DELETE FROM public.progresso_passo WHERE mentorado_id = v_user_id;
    DELETE FROM public.progresso_trilha WHERE mentorado_id = v_user_id;
    DELETE FROM public.session_reviews WHERE user_id = v_user_id;
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    DELETE FROM public.mentor_sessions WHERE user_id = v_user_id;
    DELETE FROM public.impact_history WHERE user_id = v_user_id;
    DELETE FROM public.bug_reports WHERE user_id = v_user_id;
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    DELETE FROM public.volunteer_submissions
    WHERE volunteer_id IN (
      SELECT id FROM public.volunteer_applications WHERE user_id = v_user_id
    );
    DELETE FROM public.volunteer_applications WHERE user_id = v_user_id;
    DELETE FROM public.profiles WHERE user_id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;
END $$;

-- Data correction: legacy mentee cancellation note was saved in mentor_notes.
UPDATE public.mentor_sessions ms
SET
  notes = COALESCE(NULLIF(ms.notes, ''), ms.mentor_notes),
  mentor_notes = CASE WHEN COALESCE(NULLIF(ms.notes, ''), '') = '' THEN NULL ELSE ms.mentor_notes END
FROM public.mentors m, public.profiles p
WHERE ms.mentor_id = m.id
  AND p.user_id = ms.user_id
  AND ms.status = 'cancelled'
  AND m.name ILIKE '%rodrigo%vianna%'
  AND p.name ILIKE '%amanda%'
  AND COALESCE(NULLIF(ms.mentor_notes, ''), '') <> '';
