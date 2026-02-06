import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Users, GraduationCap, MessageCircle, ChevronDown, Calendar, Send, Ban, AlertTriangle, Clock, CheckSquare, Square, Lightbulb, BarChart3, ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PlatformGuideProps {
  userType: "mentor" | "mentee";
}

const PlatformGuide = ({ userType }: PlatformGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 overflow-hidden"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Guia de como aproveitar a plataforma</h3>
                <p className="text-xs text-muted-foreground">Dicas e instruções para {userType === "mentor" ? "mentores" : "mentorados"}</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 pb-5 space-y-4"
              >
                {userType === "mentor" ? <MentorGuideContent /> : <MenteeGuideContent />}
                <FAQContent />
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

// Mentor Guide Content
const MentorGuideContent = () => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        Para Mentores
      </h4>
      
      <Accordion type="single" collapsible className="w-full space-y-2">
        <AccordionItem value="availability" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Configure sua Disponibilidade</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <p>
              Acesse a aba "Perfil" no painel do voluntário e configure seus horários disponíveis. Defina a duração padrão (30min, 45min ou 1h) e salve.
            </p>
            <TipBox>
              💡 Reserve blocos realistas. É melhor ter menos horários e conseguir cumprir!
            </TipBox>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="request" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Recebeu um Pedido de Mentoria?</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <ol className="list-decimal ml-5 space-y-1">
              <li>Você receberá notificação por email e na plataforma</li>
              <li>Revise as informações do mentorado</li>
              <li>Clique em "Confirmar" ou "Recusar"</li>
            </ol>
            <p className="font-medium text-foreground">Após confirmar:</p>
            <ul className="space-y-1">
              <li>✅ Dados de contato compartilhados</li>
              <li>✅ Templates de WhatsApp disponíveis</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="communication" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Como se Comunicar (Passo a Passo)</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-4 pb-4">
            <div className="bg-primary/5 rounded-lg p-3 space-y-2">
              <p className="font-medium text-foreground">📱 PASSO 1: Após Confirmar</p>
              <p>Use o template "Confirmação Inicial" via WhatsApp.</p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
              <p className="font-medium text-foreground">🎥 PASSO 2: Criar Link</p>
              <p>Acesse <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">meet.google.com</a> e crie o link da reunião.</p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 space-y-2">
              <p className="font-medium text-foreground">⏰ PASSO 3: 24h Antes</p>
              <p>Use o template "Lembrete 24h" com o link do Meet.</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 space-y-2">
              <p className="font-medium text-foreground">✅ PASSO 4: No Dia</p>
              <p>Entre 2-3 min antes, teste câmera/microfone.</p>
            </div>

            <div className="bg-muted rounded-lg p-3">
              <p className="font-medium text-foreground flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Resumo do Timeline
              </p>
              <div className="text-xs space-y-1">
                <p><strong>DIA 0:</strong> Confirmar + Enviar template + Criar link</p>
                <p><strong>DIA -1:</strong> Enviar lembrete com link</p>
                <p><strong>DIA DA MENTORIA:</strong> Entrar 2-3 min antes</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cancel" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Precisa Cancelar?</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <p>Se algo surgir, avise com <strong>mínimo 12h de antecedência</strong> e entre em contato direto para remarcar.</p>
            <WarningBox>
              ⚠️ Evite cancelamentos de última hora - prejudica a experiência do mentorado.
            </WarningBox>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="confirm-session" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Confirme Sessões Realizadas</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <p>Após o horário da sessão, <strong>lembre-se de confirmar se ela foi realizada</strong>. Isso é essencial para contabilizar suas métricas de impacto.</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Acesse "Minhas Mentorias" na agenda</li>
              <li>Localize a sessão pendente de confirmação</li>
              <li>Clique em "Confirmar Realização" ou "Não realizada"</li>
            </ol>
            <TipBox>
              💡 Tanto você quanto o mentorado podem confirmar a realização — basta um dos lados confirmar!
            </TipBox>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// Mentee Guide Content
const MenteeGuideContent = () => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-primary" />
        Para Mentorados
      </h4>
      
      <Accordion type="single" collapsible className="w-full space-y-2">
        <AccordionItem value="find" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Encontre um Mentor Ideal</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <p>
              Navegue pelos mentores disponíveis, leia os perfis e escolha alguém da área que você quer explorar.
            </p>
            <TipBox>
              💡 Leia as avaliações de outros mentorados!
            </TipBox>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="request" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Solicite uma Mentoria</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <ol className="list-decimal ml-5 space-y-1">
              <li>Clique em "Agendar Mentoria" no perfil do mentor</li>
              <li>Escolha dia e horário disponível</li>
              <li>Preencha sua formação e objetivo (seja específico!)</li>
              <li>Envie a solicitação</li>
            </ol>
            <WarningBox>
              ⏰ Agende com pelo menos 24h de antecedência.
            </WarningBox>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="wait" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Aguarde e Prepare-se</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <p>O mentor tem até 48h para confirmar. Você receberá email de confirmação.</p>
            <p><strong>Após confirmação:</strong></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Aguarde o mentor enviar o link da reunião</li>
              <li>Confirme sua presença via WhatsApp</li>
              <li>Prepare suas dúvidas!</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="prepare" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Checklist de Preparação</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <div className="space-y-2">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="font-medium text-foreground text-xs mb-1">3 dias antes:</p>
                <ul className="space-y-0.5 text-xs">
                  <li className="flex items-center gap-1"><Square className="w-3 h-3" /> Liste suas principais dúvidas</li>
                  <li className="flex items-center gap-1"><Square className="w-3 h-3" /> Pesquise sobre o mentor (LinkedIn)</li>
                </ul>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="font-medium text-foreground text-xs mb-1">1 dia antes:</p>
                <ul className="space-y-0.5 text-xs">
                  <li className="flex items-center gap-1"><Square className="w-3 h-3" /> Teste câmera e microfone</li>
                  <li className="flex items-center gap-1"><Square className="w-3 h-3" /> Tenha papel e caneta prontos</li>
                </ul>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="font-medium text-foreground text-xs mb-1">1 hora antes:</p>
                <ul className="space-y-0.5 text-xs">
                  <li className="flex items-center gap-1"><Square className="w-3 h-3" /> Releia suas perguntas</li>
                  <li className="flex items-center gap-1"><Square className="w-3 h-3" /> Entre em ambiente silencioso</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="during" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Durante a Mentoria</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                <p className="font-medium text-foreground text-xs mb-1">✅ Faça:</p>
                <ul className="space-y-0.5 text-xs">
                  <li>• Seja pontual</li>
                  <li>• Faça perguntas objetivas</li>
                  <li>• Anote os conselhos</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <p className="font-medium text-foreground text-xs mb-1">❌ Evite:</p>
                <ul className="space-y-0.5 text-xs">
                  <li>• Chegar atrasado</li>
                  <li>• Ficar no celular</li>
                  <li>• Perguntas genéricas</li>
                </ul>
             </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="after-session" className="bg-muted/30 border-0 rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">Após a Mentoria: Confirme e Avalie</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-sm space-y-3 pb-4">
            <p>Depois que a sessão acontecer, você ou o mentor devem <strong>confirmar que ela foi realizada</strong>. Basta um dos lados confirmar!</p>
            <WarningBox>
              ⚠️ <strong>Importante:</strong> Você precisa avaliar (escrever um review) de cada sessão concluída antes de poder agendar uma nova mentoria. Isso ajuda outros mentorados e valoriza o mentor!
            </WarningBox>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Confirme a realização da sessão (se o mentor ainda não confirmou)</li>
              <li>Escreva sua avaliação sobre a experiência</li>
              <li>Depois de avaliar, você poderá agendar novas mentorias</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// FAQ Content
const FAQContent = () => {
  const faqs = [
    {
      question: "As mentorias são gratuitas?",
      answer: "Sim! A Movê é 100% gratuita e sempre será."
    },
    {
      question: "Quanto tempo dura uma mentoria?",
      answer: "O mentor define: 30 minutos, 45 minutos ou 1 hora."
    },
    {
      question: "Posso remarcar uma mentoria?",
      answer: "Sim, mas precisa cancelar a atual e agendar nova, respeitando 24h de antecedência."
    },
    {
      question: "Preciso avaliar a mentoria?",
      answer: "Sim! Mentorados devem avaliar cada sessão concluída antes de agendar uma nova mentoria. Isso garante feedback valioso para os mentores."
    },
    {
      question: "Quem confirma que a sessão aconteceu?",
      answer: "Tanto o mentor quanto o mentorado podem confirmar a realização da sessão. Basta um dos lados confirmar para que ela seja marcada como concluída."
    },
    {
      question: "O que fazer se o mentor não aparecer?",
      answer: "Aguarde 10 minutos e entre em contato via WhatsApp. Se não houver resposta, marque a sessão como 'Não realizada'."
    },
    {
      question: "Como faço para me tornar mentor?",
      answer: "Acesse 'Quero ser Mentor' na página inicial e preencha o formulário."
    },
  ];

  return (
    <div className="space-y-3 pt-2 border-t border-border/30">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        Perguntas Frequentes
      </h4>
      
      <Accordion type="single" collapsible className="w-full space-y-2">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`} className="bg-muted/30 border-0 rounded-xl px-4">
            <AccordionTrigger className="text-left hover:no-underline py-3 text-sm">
              <span className="font-medium">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

// Helper Components
const TipBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs">
    {children}
  </div>
);

const WarningBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-2 text-xs">
    {children}
  </div>
);

export default PlatformGuide;
