-- Add category column to content_items for filtering by area
ALTER TABLE public.content_items 
ADD COLUMN category text NOT NULL DEFAULT 'geral';

-- Add a comment to explain the categories
COMMENT ON COLUMN public.content_items.category IS 'Content category: curriculo, marketing, tecnologia, soft_skills, geral';