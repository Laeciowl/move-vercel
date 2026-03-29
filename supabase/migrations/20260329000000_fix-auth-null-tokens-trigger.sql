-- Trigger to prevent GoTrue from failing with "converting NULL to string is unsupported"
-- on token columns for users created via OAuth or any flow that doesn't set these fields.
-- GoTrue (pgx driver) cannot scan NULL into a Go string, causing 500 on /recover and similar.

CREATE OR REPLACE FUNCTION public.set_default_token_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.confirmation_token         := COALESCE(NEW.confirmation_token, '');
  NEW.recovery_token             := COALESCE(NEW.recovery_token, '');
  NEW.email_change_token_new     := COALESCE(NEW.email_change_token_new, '');
  NEW.email_change               := COALESCE(NEW.email_change, '');
  NEW.email_change_token_current := COALESCE(NEW.email_change_token_current, '');
  NEW.phone_change               := COALESCE(NEW.phone_change, '');
  NEW.phone_change_token         := COALESCE(NEW.phone_change_token, '');
  NEW.reauthentication_token     := COALESCE(NEW.reauthentication_token, '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_fix_null_tokens ON auth.users;

CREATE TRIGGER on_auth_user_created_fix_null_tokens
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_token_fields();
