-- Allow newly registered users to update referrals where they are the referred user
CREATE POLICY "Users can update referrals as referred user"
ON public.referrals
FOR UPDATE
USING (true)
WITH CHECK (referred_user_id = auth.uid() AND status = 'completed');
