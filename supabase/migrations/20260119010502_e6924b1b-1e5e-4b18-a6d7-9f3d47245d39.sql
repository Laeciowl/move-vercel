-- Add 'area' column to content_items table for better categorization
-- 'area' represents broad categories (e.g., Technology, Marketing)
-- 'category' represents specific topics within an area (e.g., Data Analysis, Resume)

ALTER TABLE public.content_items 
ADD COLUMN IF NOT EXISTS area TEXT NOT NULL DEFAULT 'geral';

-- Update existing content items to have a default area based on category
UPDATE public.content_items SET area = 'carreira' WHERE category IN ('curriculo', 'marketing');
UPDATE public.content_items SET area = 'tecnologia' WHERE category = 'tecnologia';
UPDATE public.content_items SET area = 'desenvolvimento' WHERE category = 'soft_skills';
UPDATE public.content_items SET area = 'geral' WHERE area IS NULL OR area = '';

COMMENT ON COLUMN public.content_items.area IS 'Broad area category: carreira, tecnologia, negocios, desenvolvimento, geral';
COMMENT ON COLUMN public.content_items.category IS 'Specific topic within the area: curriculo, dados, marketing, etc';