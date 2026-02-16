-- Allow users to delete their own NPS responses (for upsert behavior)
CREATE POLICY "Users can delete own NPS"
ON public.nps_respostas
FOR DELETE
USING (auth.uid() = user_id);