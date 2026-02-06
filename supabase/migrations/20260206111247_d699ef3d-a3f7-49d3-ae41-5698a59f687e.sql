
-- ================================================
-- ACHIEVEMENTS SYSTEM
-- ================================================

-- Achievement user type enum
CREATE TYPE public.achievement_user_type AS ENUM ('mentor', 'mentorado', 'ambos');

-- Achievement criteria type enum
CREATE TYPE public.achievement_criteria_type AS ENUM ('count', 'sum', 'streak', 'unique', 'special');

-- Achievement category enum
CREATE TYPE public.achievement_category AS ENUM (
  'mentorias', 'tempo', 'impacto', 'consistencia', 
  'conteudo', 'exploracao', 'areas', 'preparacao', 
  'engajamento', 'especial'
);

-- Achievements definitions table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category public.achievement_category NOT NULL,
  criteria_type public.achievement_criteria_type NOT NULL,
  criteria_value INTEGER NOT NULL,
  user_type public.achievement_user_type NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage achievements"
  ON public.achievements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User achievements (progress tracking)
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ,
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements"
  ON public.user_achievements FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Content access tracking
CREATE TABLE public.content_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access log"
  ON public.content_access_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own access log"
  ON public.content_access_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Content saves
CREATE TABLE public.content_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

ALTER TABLE public.content_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saves"
  ON public.content_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saves"
  ON public.content_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves"
  ON public.content_saves FOR DELETE
  USING (auth.uid() = user_id);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create their own referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON public.user_achievements(user_id, unlocked_at) WHERE unlocked_at IS NOT NULL;
CREATE INDEX idx_content_access_user ON public.content_access_log(user_id);
CREATE INDEX idx_content_saves_user ON public.content_saves(user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

-- ================================================
-- SEED ACHIEVEMENT DEFINITIONS
-- ================================================

-- MENTOR: Mentorias Realizadas
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Primeiro Passo', 'Sua jornada como mentor começou!', '🥉', 'mentorias', 'count', 1, 'mentor', 1),
('Mentor Dedicado', 'Você está comprometido em fazer a diferença', '🥈', 'mentorias', 'count', 5, 'mentor', 2),
('Mentor Expert', 'Experiência começa a se formar', '🥇', 'mentorias', 'count', 10, 'mentor', 3),
('Mentor Elite', 'Você é um mentor de elite!', '💎', 'mentorias', 'count', 25, 'mentor', 4),
('Mentor Lendário', 'Sua dedicação é lendária', '👑', 'mentorias', 'count', 50, 'mentor', 5),
('Mentor Master', 'Você é um mestre da mentoria!', '🌟', 'mentorias', 'count', 100, 'mentor', 6);

-- MENTOR: Tempo Mentorado
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('30 Minutos de Impacto', 'Sua primeira meia hora transformadora', '⏱️', 'tempo', 'sum', 30, 'mentor', 10),
('1 Hora de Dedicação', 'Uma hora dedicada ao desenvolvimento de jovens', '⏱️', 'tempo', 'sum', 60, 'mentor', 11),
('5 Horas de Transformação', '5 horas mudando trajetórias profissionais', '⏱️', 'tempo', 'sum', 300, 'mentor', 12),
('10 Horas de Excelência', '10 horas de orientação e excelência', '⏱️', 'tempo', 'sum', 600, 'mentor', 13),
('25 Horas de Maestria', '25 horas compartilhando conhecimento', '⏱️', 'tempo', 'sum', 1500, 'mentor', 14),
('50 Horas de Legado', '50 horas construindo seu legado', '⏱️', 'tempo', 'sum', 3000, 'mentor', 15),
('100 Horas de Impacto', '100 horas transformando vidas', '⏱️', 'tempo', 'sum', 6000, 'mentor', 16);

-- MENTOR: Vidas Transformadas
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Primeira Vida Transformada', 'Você impactou sua primeira vida!', '🌱', 'impacto', 'unique', 1, 'mentor', 20),
('5 Vidas Transformadas', '5 jovens profissionais guiados por você', '🌿', 'impacto', 'unique', 5, 'mentor', 21),
('10 Vidas Transformadas', '10 carreiras impactadas pela sua experiência', '🌳', 'impacto', 'unique', 10, 'mentor', 22),
('25 Vidas Transformadas', '25 trajetórias profissionais tocadas por você', '🌲', 'impacto', 'unique', 25, 'mentor', 23),
('50 Vidas Transformadas', 'Meio centenar de vidas transformadas!', '🏞️', 'impacto', 'unique', 50, 'mentor', 24),
('100 Vidas Transformadas', 'Um centenar de jovens guiados!', '🌍', 'impacto', 'unique', 100, 'mentor', 25);

-- MENTOR: Consistência
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Pontual', 'Comprometimento é sua marca', '📅', 'consistencia', 'count', 5, 'mentor', 30),
('Confiável', 'Os mentorados podem contar com você', '📅', 'consistencia', 'count', 10, 'mentor', 31),
('Inabalável', 'Sua consistência é admirável', '📅', 'consistencia', 'count', 25, 'mentor', 32),
('Sequência de 7', '7 semanas de dedicação contínua', '🔥', 'consistencia', 'streak', 7, 'mentor', 33),
('Sequência de 30', 'Meio ano de impacto constante', '🔥', 'consistencia', 'streak', 6, 'mentor', 34),
('Sequência de 365', 'Um ano completo transformando vidas', '🔥', 'consistencia', 'streak', 12, 'mentor', 35);

-- MENTOR: Especiais
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Mentor Natalino', 'Fechou o ano impactando vidas!', '🎄', 'especial', 'special', 3, 'mentor', 40),
('Mentor de Ano Novo', 'Começou o ano com tudo!', '🎆', 'especial', 'special', 5, 'mentor', 41),
('Fundador', 'Você faz parte da história da Movê', '🏆', 'especial', 'special', 100, 'mentor', 42),
('Madrugador', 'Dedicação desde cedo', '🌅', 'especial', 'special', 5, 'mentor', 43),
('Coruja', 'Disponível mesmo fora do horário comercial', '🌙', 'especial', 'special', 5, 'mentor', 44),
('Mentor Relâmpago', 'Eficiência e objetividade', '⚡', 'especial', 'special', 5, 'mentor', 45),
('Mentor Maratonista', 'Dedicação profunda em cada sessão', '📚', 'especial', 'special', 5, 'mentor', 46);

-- MENTORADO: Mentorias Realizadas
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Primeira Mentoria', 'Você deu o primeiro passo na sua jornada de crescimento!', '🎯', 'mentorias', 'count', 1, 'mentorado', 100),
('Aprendiz Dedicado', 'Você está comprometido com seu desenvolvimento', '🎯', 'mentorias', 'count', 3, 'mentorado', 101),
('Em Busca de Conhecimento', '5 sessões de aprendizado completadas', '🎯', 'mentorias', 'count', 5, 'mentorado', 102),
('Jovem Profissional', '10 mentorias! Você está construindo sua carreira', '🎯', 'mentorias', 'count', 10, 'mentorado', 103),
('Investidor em Si Mesmo', '15 mentorias - você investe no seu futuro', '🎯', 'mentorias', 'count', 15, 'mentorado', 104),
('Protagonista da Carreira', '25 mentorias! Você é protagonista do seu crescimento', '🎯', 'mentorias', 'count', 25, 'mentorado', 105);

-- MENTORADO: Tempo Aprendendo
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('30 Minutos de Aprendizado', 'Sua primeira meia hora de crescimento', '📖', 'tempo', 'sum', 30, 'mentorado', 110),
('1 Hora de Desenvolvimento', 'Uma hora investida no seu futuro', '📖', 'tempo', 'sum', 60, 'mentorado', 111),
('5 Horas de Crescimento', '5 horas aprendendo com profissionais', '📖', 'tempo', 'sum', 300, 'mentorado', 112),
('10 Horas de Evolução', '10 horas de desenvolvimento profissional', '📖', 'tempo', 'sum', 600, 'mentorado', 113),
('25 Horas de Sabedoria', '25 horas absorvendo conhecimento', '📖', 'tempo', 'sum', 1500, 'mentorado', 114);

-- MENTORADO: Exploração
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Conhecendo o Caminho', 'Você conheceu seu primeiro mentor', '🔍', 'exploracao', 'unique', 1, 'mentorado', 120),
('Expandindo Horizontes', '3 perspectivas diferentes sobre sua carreira', '🔍', 'exploracao', 'unique', 3, 'mentorado', 121),
('Explorador de Carreiras', '5 mentores únicos!', '🔍', 'exploracao', 'unique', 5, 'mentorado', 122),
('Mente Aberta', '10 mentores compartilharam suas experiências com você', '🔍', 'exploracao', 'unique', 10, 'mentorado', 123),
('Colecionador de Sabedoria', '15 mentores! Você busca conhecimento de múltiplas fontes', '🔍', 'exploracao', 'unique', 15, 'mentorado', 124);

-- MENTORADO: Diversidade de Áreas
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Curioso', 'Você explorou 2 áreas diferentes', '🏷️', 'areas', 'unique', 2, 'mentorado', 130),
('Multi-Interessado', '3 áreas exploradas!', '🏷️', 'areas', 'unique', 3, 'mentorado', 131),
('Explorador de Áreas', '5 áreas! Você está descobrindo suas paixões', '🏷️', 'areas', 'unique', 5, 'mentorado', 132),
('Profissional Versátil', '7 áreas exploradas - versatilidade é sua força', '🏷️', 'areas', 'unique', 7, 'mentorado', 133);

-- MENTORADO: Consistência
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Primeira Sequência', 'Você está mantendo o ritmo de aprendizado', '🔥', 'consistencia', 'count', 2, 'mentorado', 140),
('Em Ritmo', 'Consistência é chave para o crescimento', '🔥', 'consistencia', 'streak', 2, 'mentorado', 141),
('Disciplinado', '3 meses seguidos investindo em você', '🔥', 'consistencia', 'streak', 3, 'mentorado', 142),
('Comprometido', 'Meio ano de desenvolvimento contínuo', '🔥', 'consistencia', 'streak', 6, 'mentorado', 143),
('Incansável', 'Um ano inteiro de evolução profissional!', '🔥', 'consistencia', 'streak', 12, 'mentorado', 144);

-- MENTORADO: Conteúdos
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Leitor Iniciante', 'Você começou a explorar nossos conteúdos', '📚', 'conteudo', 'count', 5, 'mentorado', 150),
('Leitor Ávido', '15 conteúdos acessados! Você é curioso', '📚', 'conteudo', 'count', 15, 'mentorado', 151),
('Devorador de Conteúdo', '30 conteúdos! Seu aprendizado não para', '📚', 'conteudo', 'count', 30, 'mentorado', 152),
('Biblioteca Pessoal', 'Você está construindo sua biblioteca de conhecimento', '📚', 'conteudo', 'count', 10, 'mentorado', 153),
('Curador de Conhecimento', '25 conteúdos salvos!', '📚', 'conteudo', 'count', 25, 'mentorado', 154);

-- MENTORADO: Preparação
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Bem Preparado', 'Você se prepara bem para as mentorias', '✅', 'preparacao', 'count', 5, 'mentorado', 160),
('Objetivo Claro', 'Seus objetivos são claros e detalhados', '✅', 'preparacao', 'count', 10, 'mentorado', 161);

-- MENTORADO: Engajamento
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Primeiro Review', 'Seu feedback ajuda a melhorar a plataforma', '⭐', 'engajamento', 'count', 1, 'mentorado', 170),
('Avaliador Constante', 'Você contribui para a comunidade Movê', '⭐', 'engajamento', 'count', 10, 'mentorado', 171);

-- MENTORADO: Especiais
INSERT INTO public.achievements (name, description, icon, category, criteria_type, criteria_value, user_type, sort_order) VALUES
('Focado no Objetivo', 'Você sabe o que quer e está indo buscar', '🎯', 'especial', 'special', 3, 'mentorado', 180),
('Madrugador', 'Acordando cedo para crescer', '🌅', 'especial', 'special', 3, 'mentorado', 181),
('Noturno', 'Aproveitando cada horário para aprender', '🌙', 'especial', 'special', 3, 'mentorado', 182),
('Aprendiz Natalino', 'Fechando o ano com aprendizado', '🎄', 'especial', 'special', 2, 'mentorado', 183),
('Começando Bem o Ano', 'Ano novo, metas novas, mentorias novas', '🎆', 'especial', 'special', 3, 'mentorado', 184),
('Pioneiro', 'Você faz parte da história da Movê', '🏆', 'especial', 'special', 500, 'mentorado', 185),
('Eficiente', 'Objetivo e direto ao ponto', '⚡', 'especial', 'special', 5, 'mentorado', 186),
('Estudante Dedicado', 'Você aproveita cada minuto de aprendizado', '🎓', 'especial', 'special', 5, 'mentorado', 187);
