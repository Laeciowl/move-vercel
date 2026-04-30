-- MANUAL repair: run ONLY if diagnose_legacy_referrals_state.sql shows
-- has_referral_registrations = true OR process_referral_fn references referral_registrations.
-- Safe to re-run: uses IF EXISTS / OR REPLACE.
--
-- If you already restored the DB from a backup from BEFORE the bad deploy, you may skip this.

DROP POLICY IF EXISTS "Users can view referral registrations they originated"
  ON public.referral_registrations;

DROP POLICY IF EXISTS "Admins can view all referral registrations"
  ON public.referral_registrations;

DROP TABLE IF EXISTS public.referral_registrations;

DROP FUNCTION IF EXISTS public.get_public_referrer_name_by_code(text);

CREATE OR REPLACE FUNCTION public.process_referral_on_signup(ref_code text, new_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.referrals
  SET referred_user_id = new_user_id, status = 'completed'
  WHERE referral_code = ref_code
    AND referred_user_id IS NULL
    AND id = (
      SELECT id FROM public.referrals
      WHERE referral_code = ref_code AND referred_user_id IS NULL
      LIMIT 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral_on_signup(text, uuid) TO authenticated;
