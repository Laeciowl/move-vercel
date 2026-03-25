
ALTER TABLE public.session_reviews 
  ADD COLUMN mentoria_aconteceu TEXT DEFAULT NULL,
  ADD COLUMN motivo_nao_aconteceu TEXT DEFAULT NULL;
