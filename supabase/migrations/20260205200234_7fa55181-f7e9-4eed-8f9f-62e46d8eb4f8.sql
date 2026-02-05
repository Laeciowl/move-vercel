-- Create tags table with all predefined tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Everyone can read tags
CREATE POLICY "Anyone can read tags"
ON public.tags
FOR SELECT
USING (true);

-- Only admins can manage tags
CREATE POLICY "Admins can manage tags"
ON public.tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create mentor_tags junction table
CREATE TABLE public.mentor_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentor_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.mentor_tags ENABLE ROW LEVEL SECURITY;

-- Anyone can read mentor tags
CREATE POLICY "Anyone can read mentor tags"
ON public.mentor_tags
FOR SELECT
USING (true);

-- Mentors can manage their own tags
CREATE POLICY "Mentors can insert their own tags"
ON public.mentor_tags
FOR INSERT
WITH CHECK (
  mentor_id IN (
    SELECT id FROM public.mentors WHERE email = current_user_email()
  )
);

CREATE POLICY "Mentors can delete their own tags"
ON public.mentor_tags
FOR DELETE
USING (
  mentor_id IN (
    SELECT id FROM public.mentors WHERE email = current_user_email()
  )
);

-- Create mentee_interests junction table
CREATE TABLE public.mentee_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.mentee_interests ENABLE ROW LEVEL SECURITY;

-- Users can read their own interests
CREATE POLICY "Users can read their own interests"
ON public.mentee_interests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their own interests
CREATE POLICY "Users can insert their own interests"
ON public.mentee_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests"
ON public.mentee_interests
FOR DELETE
USING (auth.uid() = user_id);

-- Insert all predefined tags
INSERT INTO public.tags (name, category, slug) VALUES
-- Carreira e Desenvolvimento
('Transição de Carreira', 'Carreira e Desenvolvimento', 'transicao-de-carreira'),
('Primeiro Emprego', 'Carreira e Desenvolvimento', 'primeiro-emprego'),
('Desenvolvimento Profissional', 'Carreira e Desenvolvimento', 'desenvolvimento-profissional'),
('Liderança e Gestão', 'Carreira e Desenvolvimento', 'lideranca-e-gestao'),
('Soft Skills', 'Carreira e Desenvolvimento', 'soft-skills'),

-- Tecnologia
('Desenvolvimento de Software', 'Tecnologia', 'desenvolvimento-de-software'),
('Ciência de Dados', 'Tecnologia', 'ciencia-de-dados'),
('Inteligência Artificial', 'Tecnologia', 'inteligencia-artificial'),
('Cibersegurança', 'Tecnologia', 'ciberseguranca'),
('UX/UI Design', 'Tecnologia', 'ux-ui-design'),
('Produtos Digitais', 'Tecnologia', 'produtos-digitais'),

-- Negócios
('Empreendedorismo', 'Negócios', 'empreendedorismo'),
('Estratégia de Negócios', 'Negócios', 'estrategia-de-negocios'),
('Marketing Digital', 'Negócios', 'marketing-digital'),
('Vendas', 'Negócios', 'vendas'),
('Finanças Corporativas', 'Negócios', 'financas-corporativas'),
('Consultoria', 'Negócios', 'consultoria'),

-- Recursos Humanos
('Recrutamento e Seleção', 'Recursos Humanos', 'recrutamento-e-selecao'),
('Gestão de Pessoas', 'Recursos Humanos', 'gestao-de-pessoas'),
('Cultura Organizacional', 'Recursos Humanos', 'cultura-organizacional'),
('Employer Branding', 'Recursos Humanos', 'employer-branding'),

-- Comunicação
('Comunicação Corporativa', 'Comunicação', 'comunicacao-corporativa'),
('Relações Públicas', 'Comunicação', 'relacoes-publicas'),
('Redação Profissional', 'Comunicação', 'redacao-profissional'),
('Oratória', 'Comunicação', 'oratoria'),

-- Análise de Dados
('Análise de Dados', 'Análise de Dados', 'analise-de-dados'),

-- Áreas Específicas
('Direito Corporativo', 'Áreas Específicas', 'direito-corporativo'),
('Engenharia', 'Áreas Específicas', 'engenharia'),
('Saúde e Medicina', 'Áreas Específicas', 'saude-e-medicina'),
('Educação', 'Áreas Específicas', 'educacao'),
('Terceiro Setor', 'Áreas Específicas', 'terceiro-setor'),

-- Habilidades Transversais
('Networking', 'Habilidades Transversais', 'networking'),
('LinkedIn e Marca Pessoal', 'Habilidades Transversais', 'linkedin-e-marca-pessoal'),
('Processos Seletivos', 'Habilidades Transversais', 'processos-seletivos'),
('Currículo e Entrevistas', 'Habilidades Transversais', 'curriculo-e-entrevistas'),
('Estudos no Exterior', 'Habilidades Transversais', 'estudos-no-exterior');

-- Create function to get mentors with match count
CREATE OR REPLACE FUNCTION public.get_mentors_with_match(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  area TEXT,
  description TEXT,
  education TEXT,
  photo_url TEXT,
  availability JSONB,
  min_advance_hours INTEGER,
  sessions_completed_count INTEGER,
  linkedin_url TEXT,
  tags JSONB,
  match_count INTEGER,
  matching_tags JSONB
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH mentor_tag_data AS (
    SELECT 
      mt.mentor_id,
      jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'category', t.category, 'slug', t.slug)) as tags
    FROM public.mentor_tags mt
    JOIN public.tags t ON t.id = mt.tag_id
    GROUP BY mt.mentor_id
  ),
  user_interests AS (
    SELECT tag_id FROM public.mentee_interests WHERE mentee_interests.user_id = user_id_param
  ),
  mentor_matches AS (
    SELECT 
      mt.mentor_id,
      COUNT(*)::INTEGER as match_count,
      jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'category', t.category, 'slug', t.slug)) as matching_tags
    FROM public.mentor_tags mt
    JOIN public.tags t ON t.id = mt.tag_id
    WHERE mt.tag_id IN (SELECT tag_id FROM user_interests)
    GROUP BY mt.mentor_id
  )
  SELECT 
    m.id,
    m.name,
    m.area,
    m.description,
    m.education,
    m.photo_url,
    m.availability,
    m.min_advance_hours,
    (
      SELECT COALESCE(COUNT(*)::integer, 0)
      FROM public.mentor_sessions ms
      WHERE ms.mentor_id = m.id
        AND ms.status = 'scheduled'
        AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW()
    ) AS sessions_completed_count,
    m.linkedin_url,
    COALESCE(mtd.tags, '[]'::jsonb) as tags,
    COALESCE(mm.match_count, 0) as match_count,
    COALESCE(mm.matching_tags, '[]'::jsonb) as matching_tags
  FROM public.mentors m
  LEFT JOIN mentor_tag_data mtd ON mtd.mentor_id = m.id
  LEFT JOIN mentor_matches mm ON mm.mentor_id = m.id
  WHERE m.status = 'approved'
  ORDER BY 
    COALESCE(mm.match_count, 0) DESC,
    (
      SELECT COALESCE(COUNT(*)::integer, 0)
      FROM public.mentor_sessions ms
      WHERE ms.mentor_id = m.id
        AND ms.status = 'scheduled'
        AND (ms.scheduled_at + make_interval(mins => COALESCE(ms.duration, 30))) < NOW()
    ) DESC,
    m.created_at ASC;
END;
$$;