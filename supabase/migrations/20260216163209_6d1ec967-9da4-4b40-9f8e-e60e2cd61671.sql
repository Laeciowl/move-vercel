
-- Enum for trail step types
CREATE TYPE public.trail_step_type AS ENUM ('conteudo', 'download', 'video', 'acao', 'mentoria');

-- Enum for development plan goal types
CREATE TYPE public.plan_goal_type AS ENUM ('primeiro_emprego', 'transicao', 'promocao', 'habilidades', 'outro');

-- ═══════════════════════════════════════════════════════
-- TRILHAS DE DESENVOLVIMENTO
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.trilhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  icone TEXT NOT NULL DEFAULT '📝',
  duracao_estimada_minutos INTEGER NOT NULL DEFAULT 60,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trilhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active trails" ON public.trilhas
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins can manage trails" ON public.trilhas
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.passos_trilha (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trilha_id UUID NOT NULL REFERENCES public.trilhas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo trail_step_type NOT NULL,
  link_externo TEXT,
  tags_mentor_requeridas TEXT[],
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.passos_trilha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trail steps" ON public.passos_trilha
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage trail steps" ON public.passos_trilha
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.progresso_trilha (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL,
  trilha_id UUID NOT NULL REFERENCES public.trilhas(id) ON DELETE CASCADE,
  iniciado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  concluido_em TIMESTAMP WITH TIME ZONE,
  progresso_percentual INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentorado_id, trilha_id)
);

ALTER TABLE public.progresso_trilha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trail progress" ON public.progresso_trilha
  FOR SELECT USING (auth.uid() = mentorado_id);

CREATE POLICY "Users can insert own trail progress" ON public.progresso_trilha
  FOR INSERT WITH CHECK (auth.uid() = mentorado_id);

CREATE POLICY "Users can update own trail progress" ON public.progresso_trilha
  FOR UPDATE USING (auth.uid() = mentorado_id);

CREATE POLICY "Admins can view all trail progress" ON public.progresso_trilha
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.progresso_passo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL,
  passo_id UUID NOT NULL REFERENCES public.passos_trilha(id) ON DELETE CASCADE,
  completado BOOLEAN NOT NULL DEFAULT false,
  completado_em TIMESTAMP WITH TIME ZONE,
  completado_automaticamente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentorado_id, passo_id)
);

ALTER TABLE public.progresso_passo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own step progress" ON public.progresso_passo
  FOR SELECT USING (auth.uid() = mentorado_id);

CREATE POLICY "Users can insert own step progress" ON public.progresso_passo
  FOR INSERT WITH CHECK (auth.uid() = mentorado_id);

CREATE POLICY "Users can update own step progress" ON public.progresso_passo
  FOR UPDATE USING (auth.uid() = mentorado_id);

CREATE POLICY "Admins can view all step progress" ON public.progresso_passo
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- ═══════════════════════════════════════════════════════
-- NPS
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.nps_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('mentor', 'mentorado')),
  nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own NPS" ON public.nps_respostas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own NPS" ON public.nps_respostas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all NPS" ON public.nps_respostas
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- ═══════════════════════════════════════════════════════
-- FEEDBACK PÓS-MENTORIA
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.mentoria_feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentoria_id UUID NOT NULL REFERENCES public.mentor_sessions(id) ON DELETE CASCADE,
  mentorado_id UUID NOT NULL,
  aprendizado_principal TEXT,
  acoes_planejadas TEXT[],
  teve_resultado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentoria_id, mentorado_id)
);

ALTER TABLE public.mentoria_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.mentoria_feedbacks
  FOR INSERT WITH CHECK (auth.uid() = mentorado_id);

CREATE POLICY "Users can view own feedback" ON public.mentoria_feedbacks
  FOR SELECT USING (auth.uid() = mentorado_id);

CREATE POLICY "Admins can view all feedback" ON public.mentoria_feedbacks
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- ═══════════════════════════════════════════════════════
-- PLANO DE DESENVOLVIMENTO PESSOAL
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.planos_desenvolvimento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL,
  meta_tipo plan_goal_type NOT NULL,
  meta_descricao TEXT NOT NULL,
  prazo_meses INTEGER NOT NULL DEFAULT 3,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_desenvolvimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON public.planos_desenvolvimento
  FOR SELECT USING (auth.uid() = mentorado_id);

CREATE POLICY "Users can insert own plans" ON public.planos_desenvolvimento
  FOR INSERT WITH CHECK (auth.uid() = mentorado_id);

CREATE POLICY "Users can update own plans" ON public.planos_desenvolvimento
  FOR UPDATE USING (auth.uid() = mentorado_id);

CREATE POLICY "Admins can view all plans" ON public.planos_desenvolvimento
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.plano_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id UUID NOT NULL REFERENCES public.planos_desenvolvimento(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('trilha', 'mentoria', 'acao')),
  referencia_id UUID,
  descricao TEXT NOT NULL,
  completado BOOLEAN NOT NULL DEFAULT false,
  completado_em TIMESTAMP WITH TIME ZONE,
  ordem INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.plano_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan items" ON public.plano_itens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.planos_desenvolvimento pd WHERE pd.id = plano_id AND pd.mentorado_id = auth.uid())
  );

CREATE POLICY "Users can insert own plan items" ON public.plano_itens
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.planos_desenvolvimento pd WHERE pd.id = plano_id AND pd.mentorado_id = auth.uid())
  );

CREATE POLICY "Users can update own plan items" ON public.plano_itens
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.planos_desenvolvimento pd WHERE pd.id = plano_id AND pd.mentorado_id = auth.uid())
  );

CREATE POLICY "Admins can view all plan items" ON public.plano_itens
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on progresso_trilha
CREATE TRIGGER update_progresso_trilha_updated_at
  BEFORE UPDATE ON public.progresso_trilha
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
