-- Reativar mentoria (Paula Lichtenfels Halegua × Amanda, 24/04/2026 ~18h)
-- No banco não há status "confirmada": sessão ativa = scheduled + mentor já tinha aceitado (confirmed_by_mentor).
--
-- IMPORTANTE: em produção, UPDATE status cancelled → scheduled dispara triggers:
--   tr_validate_session_schedule (exige data futura + antecedência)
--   tr_enforce_mentee_reconfirmation_deadline (exige reconfirmação >3h antes)
--   tr_prevent_session_overlap
-- Para sessão já no passado, desabilite os 3 triggers, rode o UPDATE/DELETE, reabilite.

-- Ver o id
SELECT ms.id, ms.status, ms.confirmed_by_mentor,
       (ms.scheduled_at AT TIME ZONE 'America/Sao_Paulo') AS horario_sp,
       m.name AS mentora, p.name AS mentorada
FROM public.mentor_sessions ms
JOIN public.mentors m ON m.id = ms.mentor_id
JOIN public.profiles p ON p.user_id = ms.user_id
WHERE m.name ILIKE '%Paula%'
  AND (m.name ILIKE '%Lichtenfels%' OR m.name ILIKE '%Halegua%')
  AND p.name ILIKE '%Amanda%'
  AND (ms.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date = DATE '2026-04-24'
  AND EXTRACT(HOUR FROM (ms.scheduled_at AT TIME ZONE 'America/Sao_Paulo')) = 18;

-- Só status + confirmações (sem apagar mentee_attendance / penalidade)
UPDATE public.mentor_sessions ms
SET
  status = 'scheduled',
  confirmed_by_mentor = true,
  confirmed_at = COALESCE(ms.confirmed_at, now()),
  reconfirmation_confirmed = true,
  reconfirmation_confirmed_at = COALESCE(ms.reconfirmation_confirmed_at, now()),
  mentor_notes = NULL
WHERE ms.id = (
  SELECT ms2.id
  FROM public.mentor_sessions ms2
  JOIN public.mentors m ON m.id = ms2.mentor_id
  JOIN public.profiles p ON p.user_id = ms2.user_id
  WHERE m.name ILIKE '%Paula%'
    AND (m.name ILIKE '%Lichtenfels%' OR m.name ILIKE '%Halegua%')
    AND p.name ILIKE '%Amanda%'
    AND (ms2.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date = DATE '2026-04-24'
    AND EXTRACT(HOUR FROM (ms2.scheduled_at AT TIME ZONE 'America/Sao_Paulo')) = 18
  ORDER BY ms2.scheduled_at DESC
  LIMIT 1
);

-- Se no admin ainda aparecer “Mentorado faltou”, aí sim apague o registro de presença dessa sessão:
-- DELETE FROM public.mentee_attendance WHERE session_id = '<uuid da sessão>';
