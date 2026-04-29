-- Schedule cron jobs for the reconfirmation flow.
--
-- Both functions have verify_jwt = false in config.toml, so the anon/publishable
-- key in the apikey header is sufficient for the API gateway to accept the request.
--
-- send-reconfirmation   : (edge function) sessões com início entre ~3h15 e ~7h → e-mail + reconfirmation_sent=true
-- auto-cancel-unconfirmed: [now+2h, now+3h], sem resposta; alinhado ao fim do prazo de confirmação (>3h no handle-reconfirmation); graça 45min após envio do e-mail
--
-- Running every 30 minutes guarantees every session falls inside at least one cron window
-- (windows are 1h wide, interval is 30m → no session can be skipped).
-- The reconfirmation_sent=false / status='scheduled' guards inside each function make
-- them fully idempotent — multiple runs never double-send or double-cancel.

-- Remove previous schedules if they exist (idempotent re-run)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('send-reconfirmation', 'auto-cancel-unconfirmed');

-- ── send-reconfirmation ───────────────────────────────────────────────────────
-- Runs every 30 minutes. Finds sessions ~6h away and emails the mentee.
SELECT cron.schedule(
  'send-reconfirmation',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://yzvhflzngbajubserdgl.supabase.co/functions/v1/send-reconfirmation',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey',        'sb_publishable_xIx96Qvd7skHr_pLJuoSWQ_GVaS6kjQ'
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) AS request_id;
  $$
);

-- ── auto-cancel-unconfirmed ───────────────────────────────────────────────────
-- Runs every 30 minutes. Finds sessions ~3h away with no confirmation and cancels them.
SELECT cron.schedule(
  'auto-cancel-unconfirmed',
  '*/30 * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://yzvhflzngbajubserdgl.supabase.co/functions/v1/auto-cancel-unconfirmed',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey',        'sb_publishable_xIx96Qvd7skHr_pLJuoSWQ_GVaS6kjQ'
      ),
      body    := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) AS request_id;
  $$
);
