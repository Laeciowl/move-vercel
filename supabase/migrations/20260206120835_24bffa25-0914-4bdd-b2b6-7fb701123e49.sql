-- Create a security definer function to process referrals during signup
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
