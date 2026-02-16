-- Allow users to delete their own plans
CREATE POLICY "Users can delete own plans"
ON public.planos_desenvolvimento
FOR DELETE
USING (auth.uid() = mentorado_id);

-- Allow users to delete their own plan items
CREATE POLICY "Users can delete own plan items"
ON public.plano_itens
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM planos_desenvolvimento pd
  WHERE pd.id = plano_itens.plano_id AND pd.mentorado_id = auth.uid()
));