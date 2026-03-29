-- Fix: GoTrue fails to scan auth.users token/change columns when their value is NULL,
-- throwing "converting NULL to string is unsupported" on POST /recover (and similar flows).
-- This affects users created via OAuth or programmatic insert that never had these fields set.
-- Backfill all affected string columns with empty string.
-- Note: ALTER TABLE is not possible here because GoTrue owns auth.users.

UPDATE auth.users
SET
  confirmation_token    = COALESCE(confirmation_token, ''),
  recovery_token        = COALESCE(recovery_token, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change               = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change               = COALESCE(phone_change, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  reauthentication_token     = COALESCE(reauthentication_token, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change IS NULL
  OR email_change_token_current IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;
