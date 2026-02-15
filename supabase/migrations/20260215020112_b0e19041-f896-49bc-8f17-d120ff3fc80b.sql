
-- Create enum for community categories
CREATE TYPE public.community_category AS ENUM ('vagas', 'networking', 'conteudo', 'outros');

-- Create partner communities table
CREATE TABLE public.partner_communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  category public.community_category NOT NULL,
  external_link TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_communities ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active communities
CREATE POLICY "Authenticated users can view active communities"
ON public.partner_communities
FOR SELECT
USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage communities"
ON public.partner_communities
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_partner_communities_updated_at
BEFORE UPDATE ON public.partner_communities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for community logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-logos', 'community-logos', true);

-- Storage policies
CREATE POLICY "Community logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-logos');

CREATE POLICY "Admins can upload community logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update community logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'community-logos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete community logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-logos' AND has_role(auth.uid(), 'admin'));
