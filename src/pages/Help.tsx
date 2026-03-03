import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HelpCircle, Loader2, ExternalLink, Lightbulb, Users, GraduationCap,
  MessageCircle, Send, Calendar, Clock, CheckSquare, Square, AlertTriangle,
  BarChart3, Heart, ArrowRight, BookOpen, Rocket, Target, FileText, ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Help = () => {
  const { user, loading: authLoading } = useAuth();
  const { isVolunteer } = useVolunteerCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Back button */}
        <button
          onClick={() => navigate("/inicio")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-button mx-auto">
            <Lightbulb className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Como Aproveitar o Movê</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Tudo que você precisa saber para crescer na carreira
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={isVolunteer ? "mentor" : "mentee"} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="mentee" className="text-xs sm:text-sm">Mentorados</TabsTrigger>
            <TabsTrigger value="mentor" className="text-xs sm:text-sm">Mentores</TabsTrigger>
            <TabsTrigger value="faq" className="text-xs sm:text-sm">FAQ</TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm">Contato</TabsTrigger>
          </TabsList>

          {/* ===== MENTEE TAB ===== */}
          <TabsContent value="mentee" className="space-y-4">
            {/* First Steps */}
            <SectionCard icon={<Rocket className="w-5 h-5 text-primary" />} title="Primeiros Passos">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StepCard number="1" title="Complete seu perfil" description="Adicione foto, bio e formação para mentores te conhecerem melhor." />
                <StepCard number="2" title="Escolha seus interesses" description="Selecione áreas para receber recomendações personalizadas." />
                <StepCard number="3" title="Agende sua primeira mentoria" description="Encontre um mentor e agende uma conversa gratuita." />
              </div>
            </SectionCard>

            {/* How to Schedule */}
            <SectionCard icon={<Target className="w-5 h-5 text-primary" />} title="Como Agendar uma Mentoria">
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="font-bold text-foreground shrink-0">1.</span> Vá para "Mentores" no menu</li>
                <li className="flex gap-2"><span className="font-bold text-foreground shrink-0">2.</span> Filtre por área de interesse</li>
                <li className="flex gap-2"><span className="font-bold text-foreground shrink-0">3.</span> Escolha um mentor e clique em "Agendar mentoria"</li>
                <li className="flex gap-2"><span className="font-bold text-foreground shrink-0">4.</span> Escolha data, horário e escreva seu objetivo</li>
                <li className="flex gap-2"><span className="font-bold text-foreground shrink-0">5.</span> Aguarde a confirmação do mentor</li>
              </ol>
              <TipBox>💡 Seja específico no objetivo para aproveitar mais!</TipBox>
            </SectionCard>

            {/* Before */}
            <SectionCard icon={<FileText className="w-5 h-5 text-primary" />} title="Antes da Mentoria">
              <ChecklistItems items={[
                "Prepare perguntas específicas",
                "Revise o perfil do mentor",
                "Tenha papel e caneta (ou app de notas)",
                "Entre no link 5 minutos antes",
                "Ambiente silencioso e boa internet",
              ]} />
            </SectionCard>

            {/* During */}
            <SectionCard icon={<MessageCircle className="w-5 h-5 text-primary" />} title="Durante a Mentoria">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                  <p className="font-semibold text-foreground text-xs mb-2">✅ Faça:</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Seja pontual</li>
                    <li>• Apresente-se brevemente</li>
                    <li>• Faça perguntas objetivas</li>
                    <li>• Anote os principais insights</li>
                    <li>• Peça exemplos práticos</li>
                  </ul>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                  <p className="font-semibold text-foreground text-xs mb-2">❌ Evite:</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Chegar atrasado</li>
                    <li>• Ficar no celular</li>
                    <li>• Perguntas genéricas</li>
                    <li>• Sair sem plano de ação</li>
                  </ul>
                </div>
              </div>
            </SectionCard>

            {/* After */}
            <SectionCard icon={<CheckSquare className="w-5 h-5 text-primary" />} title="Após a Mentoria">
              <ChecklistItems items={[
                "Confirme que a mentoria aconteceu na plataforma",
                "Avalie a sessão (obrigatório antes de agendar nova)",
                "Revise suas anotações",
                "Defina ações concretas",
                "Execute o que planejou",
              ]} />
              <WarningBox>⚠️ Você precisa avaliar cada sessão concluída antes de agendar uma nova mentoria.</WarningBox>
            </SectionCard>

            {/* Tips */}
            <SectionCard icon={<Lightbulb className="w-5 h-5 text-primary" />} title="Dicas para Aproveitar ao Máximo">
              <div className="space-y-2">
                <TipItem text="Complete seu perfil: mentores te entendem melhor" />
                <TipItem text="Seja específico: objetivos claros = mentorias melhores" />
                <TipItem text="Explore conteúdos: chegue preparado nas conversas" />
                <TipItem text="Mentorias regulares: consistência gera transformação" />
                <TipItem text="Participe da comunidade: cresça junto com outros" />
              </div>
            </SectionCard>
          </TabsContent>

          {/* ===== MENTOR TAB ===== */}
          <TabsContent value="mentor" className="space-y-4">
            <SectionCard icon={<Rocket className="w-5 h-5 text-primary" />} title="Como Começar como Mentor">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StepCard number="1" title="Configure disponibilidade" description="Defina seus horários e duração padrão das sessões." />
                <StepCard number="2" title="Complete seu perfil" description="Adicione bio, áreas de atuação e LinkedIn." />
                <StepCard number="3" title="Aguarde solicitações" description="Mentorados encontrarão você pela busca." />
              </div>
            </SectionCard>

            <SectionCard icon={<Send className="w-5 h-5 text-primary" />} title="Recebendo Solicitações">
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="font-bold text-foreground shrink-0">1.</span> Você receberá notificação por email e na plataforma</li>
                <li className="flex gap-2"><span className="font-bold text-foreground shrink-0">2.</span> Revise as informações do mentorado</li>
                <li className="flex gap-2"><span className="font-bold text-foreground shrink-0">3.</span> Clique em "Confirmar" ou "Recusar"</li>
              </ol>
              <div className="mt-3 bg-muted/30 rounded-xl p-3">
                <p className="font-medium text-foreground text-xs mb-1">Após confirmar:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>✅ Dados de contato compartilhados</li>
                  <li>✅ Templates de WhatsApp disponíveis</li>
                </ul>
              </div>
            </SectionCard>

            <SectionCard icon={<MessageCircle className="w-5 h-5 text-primary" />} title="Comunicação (Passo a Passo)">
              <div className="space-y-2">
                <TimelineStep color="bg-primary/10" label="DIA 0" text="Confirmar + Enviar template + Criar link do Meet" />
                <TimelineStep color="bg-yellow-50 dark:bg-yellow-900/20" label="DIA -1" text="Enviar lembrete 24h com link do Meet" />
                <TimelineStep color="bg-green-50 dark:bg-green-900/20" label="DIA DA MENTORIA" text="Entrar 2-3 min antes, testar câmera/mic" />
              </div>
            </SectionCard>

            <SectionCard icon={<Calendar className="w-5 h-5 text-primary" />} title="Gerenciando sua Agenda">
              <ChecklistItems items={[
                "Configure horários na aba 'Minha Agenda'",
                "Defina antecedência mínima (12h-72h)",
                "Bloqueie períodos de indisponibilidade",
                "Use templates de WhatsApp para agilizar comunicação",
              ]} />
            </SectionCard>

            <SectionCard icon={<CheckSquare className="w-5 h-5 text-primary" />} title="Após a Mentoria">
              <ChecklistItems items={[
                "Confirme a realização da sessão na plataforma",
                "Adicione notas sobre o mentorado (opcional)",
                "Sessões confirmadas contam para conquistas e certificados",
              ]} />
              <TipBox>💡 Tanto você quanto o mentorado podem confirmar — basta um dos lados!</TipBox>
            </SectionCard>

            <SectionCard icon={<AlertTriangle className="w-5 h-5 text-primary" />} title="Precisa Cancelar?">
              <p className="text-sm text-muted-foreground mb-2">
                Se algo surgir, avise com <strong className="text-foreground">mínimo 12h de antecedência</strong> e entre em contato direto para remarcar.
              </p>
              <WarningBox>⚠️ Evite cancelamentos de última hora — prejudica a experiência do mentorado.</WarningBox>
            </SectionCard>
          </TabsContent>

          {/* ===== FAQ TAB ===== */}
          <TabsContent value="faq" className="space-y-4">
            <SectionCard icon={<HelpCircle className="w-5 h-5 text-primary" />} title="Perguntas Frequentes">
              <Accordion type="single" collapsible className="w-full space-y-2">
                <FAQItem value="1" question="As mentorias são gratuitas?"
                  answer="Sim! O Movê é 100% gratuito. Sempre foi e sempre será. Nossos mentores são voluntários que doam seu tempo para ajudar jovens profissionais a crescerem." />
                <FAQItem value="2" question="Quanto tempo dura uma mentoria?"
                  answer="Geralmente 30 a 60 minutos. O mentor define a duração disponível e você escolhe ao agendar." />
                <FAQItem value="3" question="Posso remarcar uma mentoria?"
                  answer="Sim, mas com antecedência. Cancele na plataforma e avise o mentor por WhatsApp. Respeite o tempo do mentor!" />
                <FAQItem value="4" question="Preciso avaliar a mentoria?"
                  answer="Sim! Mentorados devem avaliar cada sessão concluída antes de agendar uma nova mentoria. Isso garante feedback valioso para os mentores." />
                <FAQItem value="5" question="Quem confirma que a mentoria aconteceu?"
                  answer="Tanto o mentor quanto o mentorado podem confirmar. Basta um dos lados confirmar para que ela seja marcada como concluída." />
                <FAQItem value="6" question="O que fazer se o mentor não aparecer?"
                  answer="Aguarde 10 minutos e entre em contato via WhatsApp. Se não houver resposta, marque a sessão como 'Não realizada'." />
                <FAQItem value="7" question="Como faço para ser mentor?"
                  answer="Cadastre-se como mentor no site! É simples e rápido. Você define suas áreas e disponibilidade." />
                <FAQItem value="8" question="Posso ter mentoria com mais de um mentor?"
                  answer="Sim! Incentivamos conversar com mentores de áreas diferentes para ter visões diversas." />
              </Accordion>
            </SectionCard>
          </TabsContent>

          {/* ===== CONTACT TAB ===== */}
          <TabsContent value="contact" className="space-y-4">
            <SectionCard icon={<Heart className="w-5 h-5 text-primary" />} title="Precisa de Ajuda?">
              <p className="text-sm text-muted-foreground mb-4">
                Não encontrou o que procurava? Fale com a gente:
              </p>
              <a
                href="https://www.linkedin.com/in/laecio-rodrigues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl">
                  <ExternalLink className="w-4 h-4" />
                  Falar com Suporte no LinkedIn
                </Button>
              </a>
            </SectionCard>

            <SectionCard icon={<MessageCircle className="w-5 h-5 text-primary" />} title="Comunidade Movê">
              <p className="text-sm text-muted-foreground mb-3">
                Tire dúvidas com outros mentorados e mentores na nossa comunidade:
              </p>
              <a
                href="https://chat.whatsapp.com/BFDDkhbwz5aFdg6WhIFU6C"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 rounded-xl">
                  <MessageCircle className="w-4 h-4" />
                  Entrar na comunidade WhatsApp
                </Button>
              </a>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
};

// ===== Helper Components =====

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 space-y-3"
  >
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="bg-muted/30 rounded-xl p-4 text-center space-y-2">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
      <span className="text-sm font-bold text-primary">{number}</span>
    </div>
    <h4 className="font-semibold text-foreground text-sm">{title}</h4>
    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const ChecklistItems = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
        <span className="text-green-600 shrink-0 mt-0.5">✓</span>
        {item}
      </li>
    ))}
  </ul>
);

const TipBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-xs text-foreground mt-2">
    {children}
  </div>
);

const WarningBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-3 text-xs text-foreground mt-2">
    {children}
  </div>
);

const TipItem = ({ text }: { text: string }) => (
  <div className="flex items-start gap-2 text-sm text-muted-foreground">
    <span className="text-primary shrink-0">💡</span>
    {text}
  </div>
);

const TimelineStep = ({ color, label, text }: { color: string; label: string; text: string }) => (
  <div className={`${color} rounded-xl p-3`}>
    <p className="text-xs"><strong className="text-foreground">{label}:</strong> <span className="text-muted-foreground">{text}</span></p>
  </div>
);

const FAQItem = ({ value, question, answer }: { value: string; question: string; answer: string }) => (
  <AccordionItem value={`faq-${value}`} className="bg-muted/30 border-0 rounded-xl px-4">
    <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
      <span className="font-medium">{question}</span>
    </AccordionTrigger>
    <AccordionContent className="text-muted-foreground text-sm pb-4">
      {answer}
    </AccordionContent>
  </AccordionItem>
);

export default Help;
