-- Mentor photos: allow UPDATE/DELETE when folder is mentors.id for the logged-in mentor (not only auth.uid()).
DROP POLICY IF EXISTS "Users can update own mentor-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own mentor-photos" ON storage.objects;

CREATE POLICY "Users can update own mentor-photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mentor-photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.mentors m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND lower(trim(m.email)) = lower(trim(public.current_user_email()))
    )
  )
);

CREATE POLICY "Users can delete own mentor-photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mentor-photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.mentors m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND lower(trim(m.email)) = lower(trim(public.current_user_email()))
    )
  )
);

-- Trail sync when session is completed: callable by mentee OR by that session's mentor (RLS blocks mentor on progresso_*).
CREATE OR REPLACE FUNCTION public.sync_trail_mentoria_for_completed_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mentee uuid;
  v_mentor uuid;
  v_slugs text[];
  r_step record;
  v_exists boolean;
  v_req text[];
  v_has boolean;
  v_all_ids uuid[];
  v_done int;
  v_total int;
  v_pct int;
BEGIN
  SELECT ms.user_id, ms.mentor_id
  INTO v_mentee, v_mentor
  FROM public.mentor_sessions ms
  WHERE ms.id = p_session_id
    AND ms.status = 'completed';

  IF v_mentee IS NULL THEN
    RETURN;
  END IF;

  IF auth.uid() IS DISTINCT FROM v_mentee AND NOT EXISTS (
    SELECT 1
    FROM public.mentors m
    WHERE m.id = v_mentor
      AND lower(trim(m.email)) = lower(trim(public.current_user_email()))
  ) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT coalesce(array_agg(lower(trim(t.slug))), ARRAY[]::text[])
  INTO v_slugs
  FROM public.mentor_tags mt
  JOIN public.tags t ON t.id = mt.tag_id
  WHERE mt.mentor_id = v_mentor;

  FOR r_step IN
    SELECT pt.id, pt.trilha_id, pt.tags_mentor_requeridas
    FROM public.passos_trilha pt
    WHERE pt.tipo = 'mentoria'
      AND pt.trilha_id IN (
        SELECT ptr.trilha_id
        FROM public.progresso_trilha ptr
        WHERE ptr.mentorado_id = v_mentee
          AND ptr.concluido_em IS NULL
      )
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM public.progresso_passo pp
      WHERE pp.mentorado_id = v_mentee
        AND pp.passo_id = r_step.id
        AND pp.completado = true
    )
    INTO v_exists;

    IF v_exists THEN
      CONTINUE;
    END IF;

    v_req := coalesce(r_step.tags_mentor_requeridas, ARRAY[]::text[]);

    IF v_req IS NULL OR array_length(v_req, 1) IS NULL THEN
      v_has := true;
    ELSE
      v_has := EXISTS (
        SELECT 1
        FROM unnest(v_req) AS r(req)
        CROSS JOIN unnest(v_slugs) AS s(slug)
        WHERE length(trim(s.slug)) > 0
          AND (
            lower(trim(r.req)) = lower(trim(s.slug))
            OR lower(trim(s.slug)) LIKE '%' || lower(trim(r.req)) || '%'
            OR lower(trim(r.req)) LIKE '%' || lower(trim(s.slug)) || '%'
            OR (
              lower(trim(r.req)) ~ '(rh|hr|recursos|human)'
              AND lower(trim(s.slug)) ~ '(rh|hr|recursos|human)'
            )
          )
      );
    END IF;

    IF NOT coalesce(v_has, false) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.progresso_passo (
      mentorado_id,
      passo_id,
      completado,
      completado_em,
      completado_automaticamente
    )
    VALUES (v_mentee, r_step.id, true, now(), true)
    ON CONFLICT (mentorado_id, passo_id)
    DO UPDATE SET
      completado = true,
      completado_em = excluded.completado_em,
      completado_automaticamente = true;

    SELECT coalesce(array_agg(pt2.id), ARRAY[]::uuid[])
    INTO v_all_ids
    FROM public.passos_trilha pt2
    WHERE pt2.trilha_id = r_step.trilha_id;

    IF v_all_ids IS NULL OR cardinality(v_all_ids) = 0 THEN
      CONTINUE;
    END IF;

    SELECT count(*)::int
    INTO v_done
    FROM public.progresso_passo pp
    WHERE pp.mentorado_id = v_mentee
      AND pp.completado = true
      AND pp.passo_id = ANY (v_all_ids);

    v_total := cardinality(v_all_ids);
    v_pct := round(100.0 * v_done / greatest(v_total, 1))::int;

    UPDATE public.progresso_trilha pt
    SET
      progresso_percentual = v_pct,
      concluido_em = CASE
        WHEN v_done >= v_total THEN now()
        ELSE pt.concluido_em
      END,
      updated_at = now()
    WHERE pt.mentorado_id = v_mentee
      AND pt.trilha_id = r_step.trilha_id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_trail_mentoria_for_completed_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_trail_mentoria_for_completed_session(uuid) TO authenticated;
