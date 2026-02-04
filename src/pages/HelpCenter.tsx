import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, HelpCircle, Users, GraduationCap, MessageCircle, ChevronDown, ExternalLink, CheckSquare, Square, Clock, Calendar, Send, AlertTriangle, Lightbulb, Ban, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState("mentors");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <div className="flex-1 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Central de Ajuda</h1>
          </div>
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Entrar
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Central de Ajuda - Movê
          </h2>
          <p className="text-muted-foreground text-lg">
            Tudo que você precisa saber para aproveitar ao máximo a plataforma
          </p>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="mentors" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Para</span> Mentores
            </TabsTrigger>
            <TabsTrigger value="mentees" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Para</span> Mentorados
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              FAQ
            </TabsTrigger>
          </TabsList>

          {/* Tab: Para Mentores */}
          <TabsContent value="mentors" className="space-y-4">
            <MentorsHelpContent />
          </TabsContent>

          {/* Tab: Para Mentorados */}
          <TabsContent value="mentees" className="space-y-4">
            <MenteesHelpContent />
          </TabsContent>

          {/* Tab: FAQ */}
          <TabsContent value="faq" className="space-y-4">
            <FAQContent />
          </TabsContent>
        </Tabs>

        {/* Support Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ainda tem dúvidas?
            </h3>
            <p className="text-muted-foreground mb-4">
              Entre em contato com nossa equipe de suporte
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a
                href="https://www.linkedin.com/in/laecioof/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com Suporte
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Movê - Movimento Estudantil. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

// Mentors Help Content
const MentorsHelpContent = () => {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      <AccordionItem value="availability" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">1. Configure sua Disponibilidade</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <p>
            Acesse seu perfil e clique em "Gerenciar Disponibilidade". Selecione os dias e horários que você pode atender, defina a duração padrão das suas mentorias (30min, 45min ou 1h) e salve suas alterações.
          </p>
          <TipBox>
            💡 <strong>Dica:</strong> Reserve blocos de horário realistas. É melhor ter menos horários e conseguir cumprir do que se comprometer demais.
          </TipBox>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="block" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <Ban className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">2. Bloqueie Horários quando Necessário</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <p>Precisa cancelar um horário disponível?</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Vá em "Minha Agenda"</li>
            <li>Clique no horário que quer bloquear</li>
            <li>Selecione "Bloquear este horário"</li>
            <li>Pronto! Ele não aparecerá mais para agendamentos</li>
          </ul>
          <WarningBox>
            ⚠️ <strong>Importante:</strong> Se já houver mentoria agendada neste horário, você precisará cancelá-la e avisar o mentorado.
          </WarningBox>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="request" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">3. Recebeu um Pedido de Mentoria?</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <p><strong>O que fazer:</strong></p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Você receberá notificação por email e na plataforma</li>
            <li>Revise as informações do mentorado: Nome e formação, Objetivo da mentoria, Horário solicitado</li>
            <li>Clique em "Confirmar" ou "Recusar"</li>
          </ol>
          <p className="font-medium text-foreground">Após confirmar:</p>
          <ul className="space-y-1">
            <li>✅ Dados de contato compartilhados com o mentorado</li>
            <li>✅ Acesso aos templates de WhatsApp para facilitar comunicação</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="communication" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">4. Como se Comunicar com o Mentorado (Guia Completo)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-6 pt-2">
          <p className="text-foreground font-medium">A comunicação clara e proativa é essencial para uma boa experiência de mentoria.</p>
          
          {/* Step 1 */}
          <div className="bg-primary/5 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              📱 PASSO 1: Logo Após Confirmar a Mentoria
            </h4>
            <p><strong>Quando:</strong> Assim que você aceitar o pedido de mentoria</p>
            <p><strong>O que fazer:</strong></p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Na tela de "Mentoria Confirmada", role até "💬 Templates para WhatsApp"</li>
              <li>Clique em "Enviar no WhatsApp" do template "Confirmação Inicial"</li>
              <li>WhatsApp Web abrirá com a mensagem pronta</li>
              <li>Revise a mensagem (pode editar se quiser)</li>
              <li>Clique em "Enviar"</li>
            </ol>
            <p><strong>Por que é importante:</strong></p>
            <ul className="space-y-1">
              <li>✅ Confirma que você recebeu o pedido</li>
              <li>✅ Tranquiliza o mentorado</li>
              <li>✅ Estabelece primeiro contato</li>
              <li>✅ Mostra profissionalismo</li>
            </ul>
            <TipBox>
              💡 <strong>Dica:</strong> Envie essa mensagem no mesmo dia ou no máximo em 24h após confirmar.
            </TipBox>
          </div>

          {/* Step 2 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              🎥 PASSO 2: Criar o Link da Reunião
            </h4>
            <p><strong>Quando:</strong> Após enviar a confirmação inicial</p>
            <p><strong>O que fazer:</strong></p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Acesse <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">meet.google.com</a> (é gratuito!)</li>
              <li>Clique em "Nova reunião"</li>
              <li>Selecione "Criar uma reunião para mais tarde"</li>
              <li>Copie o link gerado (ex: https://meet.google.com/abc-defg-hij)</li>
              <li>Guarde esse link - você enviará no dia anterior</li>
            </ol>
            <p><strong>Alternativas ao Google Meet:</strong> Zoom (se tiver conta), Microsoft Teams, ou qualquer plataforma de vídeo que preferir.</p>
            <TipBox>
              💡 <strong>Dica:</strong> Você pode usar o mesmo link para todas as suas mentorias ou criar um link único para cada uma.
            </TipBox>
          </div>

          {/* Step 3 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              ⏰ PASSO 3: 24 Horas Antes da Mentoria
            </h4>
            <p><strong>Quando:</strong> Exatamente 1 dia antes da mentoria</p>
            <p><strong>O que fazer:</strong></p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Volte na plataforma Movê</li>
              <li>Acesse "Minhas Mentorias" → Mentoria agendada</li>
              <li>Role até "💬 Templates para WhatsApp"</li>
              <li>Clique em "Enviar no WhatsApp" do template "Lembrete 24h Antes"</li>
              <li><strong>ANTES DE ENVIAR:</strong> Cole o link do Google Meet no lugar de "[Cole aqui o link...]"</li>
              <li>Clique em "Enviar"</li>
            </ol>
            <p><strong>Por que é importante:</strong></p>
            <ul className="space-y-1">
              <li>✅ Evita que o mentorado esqueça</li>
              <li>✅ Fornece o link com antecedência</li>
              <li>✅ Permite que o mentorado confirme ou avise se surgiu imprevisto</li>
              <li>✅ Tempo para testar câmera/microfone</li>
            </ul>
            <TipBox>
              💡 <strong>Dica:</strong> Configure um lembrete no seu celular para não esquecer!
            </TipBox>
          </div>

          {/* Step 4 */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              ✅ PASSO 4: No Dia da Mentoria
            </h4>
            <p><strong>Quando:</strong> 2-3 minutos antes do horário</p>
            <p><strong>O que fazer:</strong></p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Entre no link do Google Meet que você criou</li>
              <li>Teste câmera e microfone</li>
              <li>Tenha em mãos: O objetivo que o mentorado escreveu, Papel/app de notas para anotar pontos-chave, Seu LinkedIn aberto (caso queira compartilhar contatos)</li>
            </ol>
            <p><strong>Durante a mentoria:</strong></p>
            <ul className="space-y-1">
              <li>✅ Seja pontual</li>
              <li>✅ Apresente-se brevemente (2-3 min)</li>
              <li>✅ Deixe o mentorado falar sobre suas dúvidas</li>
              <li>✅ Compartilhe experiências práticas</li>
              <li>✅ Seja honesto e realista</li>
              <li>✅ Dê exemplos concretos</li>
              <li>✅ Termine 2-3 min antes para não estourar o tempo</li>
            </ul>
          </div>

          {/* Step 5 */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              💌 PASSO 5: Após a Mentoria (Opcional mas Recomendado)
            </h4>
            <p><strong>O que fazer:</strong></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Envie uma mensagem de follow-up se achar relevante</li>
              <li>Compartilhe links/materiais que prometeu durante a conversa</li>
              <li>Conecte-se no LinkedIn se fizer sentido</li>
            </ul>
            <p className="italic">"[Nome], foi ótimo conversar com você hoje! Conforme prometi, aqui estão os links... Qualquer dúvida, pode chamar! Sucesso na sua jornada! 🚀"</p>
          </div>

          {/* Don'ts */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              ❌ O Que NÃO Fazer
            </h4>
            <ul className="space-y-1">
              <li>❌ Confirmar mentoria e não entrar em contato</li>
              <li>❌ Enviar link da reunião apenas no dia (mentorado pode estar offline)</li>
              <li>❌ Chegar atrasado sem avisar</li>
              <li>❌ Cancelar em cima da hora</li>
              <li>❌ Esquecer de criar o link do Meet</li>
            </ul>
          </div>

          {/* Timeline Summary */}
          <div className="bg-muted rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              📊 Resumo do Timeline
            </h4>
            <div className="space-y-2 text-sm">
              <p><strong>DIA 0 (Confirmação):</strong></p>
              <ul className="ml-4">
                <li>└─ ✅ Enviar template "Confirmação Inicial"</li>
                <li>└─ ✅ Criar link do Google Meet</li>
              </ul>
              <p><strong>DIA -1 (24h antes):</strong></p>
              <ul className="ml-4">
                <li>└─ ✅ Enviar template "Lembrete 24h Antes" com link</li>
              </ul>
              <p><strong>DIA DA MENTORIA:</strong></p>
              <ul className="ml-4">
                <li>└─ ✅ Entrar 2-3 min antes</li>
                <li>└─ ✅ Realizar mentoria</li>
                <li>└─ ✅ (Opcional) Enviar follow-up depois</li>
              </ul>
            </div>
          </div>

          {/* Extra Tips */}
          <div className="bg-primary/10 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              💡 Dicas Extras de Ouro
            </h4>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Use a função "agendar mensagem" do WhatsApp (se tiver WhatsApp Business) para enviar o lembrete automaticamente 24h antes</li>
              <li><strong>Configure alarmes:</strong> 1 dia antes às 9h: "Enviar lembrete WhatsApp" | No dia às [horário - 15min]: "Entrar na mentoria"</li>
              <li>Tenha uma pasta de materiais úteis prontos para compartilhar: Artigos sobre carreira, Templates de currículo, Dicas de LinkedIn, Vagas que você viu</li>
              <li><strong>Seja humano:</strong> Não precisa ser super formal. Um "oi, tudo bem?" quebra o gelo!</li>
              <li><strong>Respeite o tempo:</strong> 30 minutos passam rápido. Seja objetivo mas acolhedor.</li>
            </ol>
            <p className="text-foreground font-medium mt-4">
              🚀 Lembre-se: Você está fazendo a diferença na vida de alguém. Pequenas ações (como enviar uma mensagem no WhatsApp) criam grandes impactos!
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="cancel" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">5. Precisa Cancelar?</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <p><strong>Se algo urgente surgir:</strong></p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Avise o mentorado <strong>COM ANTECEDÊNCIA</strong> (mínimo 12h)</li>
            <li>Vá em "Minhas Mentorias"</li>
            <li>Clique em "Cancelar Mentoria"</li>
            <li>Entre em contato direto para remarcar</li>
          </ol>
          <WarningBox>
            ⚠️ Evite cancelamentos de última hora - isso prejudica muito a experiência do mentorado.
          </WarningBox>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

// Mentees Help Content
const MenteesHelpContent = () => {
  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      <AccordionItem value="find" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">1. Encontre um Mentor Ideal</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <p>
            Navegue pelos mentores disponíveis, leia os perfis e áreas de especialização, e escolha alguém que trabalhe na área que você quer explorar.
          </p>
          <TipBox>
            💡 <strong>Dica:</strong> Leia as avaliações de outros mentorados!
          </TipBox>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="request" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <Send className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">2. Solicite uma Mentoria</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <p><strong>Passo a passo:</strong></p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Clique em "Agendar Mentoria" no perfil do mentor</li>
            <li>Escolha dia e horário disponível</li>
            <li>Preencha: Sua formação atual e Objetivo da mentoria (seja específico!)</li>
            <li>Envie a solicitação</li>
          </ol>
          <WarningBox>
            ⏰ <strong>Atenção à antecedência:</strong> Você precisa agendar com pelo menos 24 horas de antecedência. Horários já passados não estarão disponíveis.
          </WarningBox>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="wait" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">3. Aguarde Confirmação</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <ul className="list-disc ml-5 space-y-1">
            <li>O mentor tem até 48h para responder</li>
            <li>Você receberá notificação por email quando for confirmado</li>
          </ul>
          <p><strong>✅ Se aprovado, você receberá:</strong></p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Dados de contato do mentor (email e WhatsApp)</li>
            <li>Botão direto para abrir conversa no WhatsApp</li>
            <li>Instruções do próximo passo</li>
          </ul>
          <p><strong>📱 O que fazer após confirmação:</strong></p>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Entre em contato via WhatsApp com o mentor</li>
            <li>Aguarde ele enviar o link da reunião (Google Meet, Zoom, etc.)</li>
            <li>Confirme sua presença</li>
            <li>Prepare suas dúvidas!</li>
          </ol>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="prepare" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">4. Prepare-se para a Mentoria</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <p><strong>📋 Checklist de preparação:</strong></p>
          
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground mb-2">3 dias antes:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Liste suas principais dúvidas</li>
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Pesquise sobre a trajetória do mentor (LinkedIn)</li>
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Prepare perguntas específicas</li>
              </ul>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground mb-2">1 dia antes:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Revise o link do Google Meet</li>
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Teste sua câmera e microfone</li>
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Tenha papel e caneta/app de notas pronto</li>
              </ul>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="font-medium text-foreground mb-2">1 hora antes:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Releia suas perguntas</li>
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Entre em um ambiente silencioso</li>
                <li className="flex items-center gap-2"><Square className="w-4 h-4" /> Tenha seu currículo em mãos (se for falar sobre carreira)</li>
              </ul>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="during" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">5. Durante a Mentoria</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <p className="font-medium text-foreground mb-2">✅ Faça:</p>
              <ul className="space-y-1 text-sm">
                <li>• Seja pontual (entre 2min antes)</li>
                <li>• Apresente-se brevemente</li>
                <li>• Faça perguntas objetivas</li>
                <li>• Anote os conselhos</li>
                <li>• Peça exemplos práticos</li>
                <li>• Agradeça o tempo do mentor</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <p className="font-medium text-foreground mb-2">❌ Evite:</p>
              <ul className="space-y-1 text-sm">
                <li>• Chegar atrasado</li>
                <li>• Ficar no celular</li>
                <li>• Fazer perguntas muito genéricas</li>
                <li>• Monopolizar a conversa sem ouvir</li>
              </ul>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="after" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">6. Depois da Mentoria</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <ul className="list-disc ml-5 space-y-1">
            <li>Avalie a experiência na plataforma</li>
            <li>Coloque em prática o que aprendeu</li>
            <li>Se foi útil, compartilhe a Movê com amigos!</li>
            <li>Você pode solicitar nova mentoria após 30 dias</li>
          </ul>
          <TipBox>
            💌 <strong>Mensagem de agradecimento:</strong> Envie um WhatsApp agradecendo e contando como vai aplicar os conselhos!
          </TipBox>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="cancel-mentee" className="bg-card border rounded-xl px-4">
        <AccordionTrigger className="text-left hover:no-underline">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold">7. Precisa Cancelar?</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pt-2">
          <p>Imprevistos acontecem, mas:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Avise <strong>COM ANTECEDÊNCIA</strong> (mínimo 24h)</li>
            <li>Vá em "Minhas Mentorias"</li>
            <li>Clique em "Cancelar"</li>
            <li>Entre em contato direto com o mentor</li>
          </ul>
          <WarningBox>
            ⚠️ Cancelamentos frequentes podem limitar futuros agendamentos.
          </WarningBox>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

// FAQ Content
const FAQContent = () => {
  const faqs = [
    {
      question: "Posso agendar mais de uma mentoria por mês?",
      answer: "Sim! Mas recomendamos espaçar ao menos 30 dias entre mentorias com o mesmo mentor."
    },
    {
      question: "O que fazer se o mentor não aparecer?",
      answer: "Aguarde 10 minutos e entre em contato via WhatsApp. Se não houver resposta, reporte através do botão \"Reportar Problema\"."
    },
    {
      question: "Posso remarcar uma mentoria?",
      answer: "Sim, mas precisa cancelar a atual e agendar nova, respeitando 24h de antecedência."
    },
    {
      question: "As mentorias são gratuitas mesmo?",
      answer: "Sim! A Movê é 100% gratuita e sempre será."
    },
    {
      question: "Quanto tempo dura uma mentoria?",
      answer: "O mentor define: 30 minutos, 45 minutos ou 1 hora."
    },
    {
      question: "Como os mentores recebem o link da reunião?",
      answer: "Os mentores criam o link (Google Meet, Zoom, etc.) e enviam diretamente via WhatsApp para o mentorado."
    },
    {
      question: "Preciso ter conta no Google para participar?",
      answer: "Não necessariamente. Depende da plataforma que o mentor escolher. Google Meet permite entrar como convidado sem conta."
    },
    {
      question: "Posso ser mentor e mentorado ao mesmo tempo?",
      answer: "Sim! Você pode ter os dois perfis na plataforma."
    },
    {
      question: "Como faço para me tornar mentor?",
      answer: "Acesse \"Quero ser Mentor\" no menu e preencha o formulário de inscrição."
    },
    {
      question: "O que acontece se eu cancelar muitas vezes?",
      answer: "Cancelamentos frequentes podem resultar em limitação temporária de agendamentos para preservar a experiência dos mentores/mentorados."
    },
  ];

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`faq-${index}`} className="bg-card border rounded-xl px-4">
          <AccordionTrigger className="text-left hover:no-underline">
            <span className="font-medium">{faq.question}</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground pt-2">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

// Helper Components
const TipBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
    {children}
  </div>
);

const WarningBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 text-sm">
    {children}
  </div>
);

export default HelpCenter;
