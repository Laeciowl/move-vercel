import { useState } from "react";
import { MessageSquare, Copy, Check, Send, Info, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

interface WhatsAppTemplatesProps {
  menteeName: string;
  menteePhone: string | null;
  scheduledAt: string;
  duration: number;
  objective: string | null;
  mentorName?: string;
  meetingLink?: string | null;
}

const WhatsAppTemplates = ({
  menteeName,
  menteePhone,
  scheduledAt,
  duration,
  objective,
  mentorName,
  meetingLink,
}: WhatsAppTemplatesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const firstName = menteeName.split(" ")[0];
  const sessionDate = new Date(scheduledAt);
  const fullDate = format(sessionDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const time = format(sessionDate, "HH:mm", { locale: ptBR });
  const durationText = `${duration || 30} minutos`;

  const confirmationTemplate = `Olá ${firstName}! 👋
${mentorName ? `\nAqui é ${mentorName}, seu mentor(a) da plataforma Movê!\n` : ""}
Confirmando nossa mentoria:

📅 ${fullDate}
🕐 ${time} (horário de Brasília)
⏱️ ${durationText}

${objective ? `Vamos conversar sobre:
${objective}

` : ""}${meetingLink ? `🎥 Link da reunião:
${meetingLink}` : `Vou criar o link da reunião e te envio até amanhã, ok?`}

Qualquer dúvida, estou por aqui!`;

  const reminderTemplate = `Oi ${firstName}! 😊

Lembrete: nossa mentoria é AMANHÃ às ${time}!

🎥 Link da reunião:
${meetingLink || "[Cole aqui o link do Google Meet/Zoom]"}

Confirma presença? 🚀`;

  const formatPhoneForWhatsApp = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("55") && cleanPhone.length >= 12) {
      return cleanPhone;
    }
    return `55${cleanPhone}`;
  };

  const openWhatsApp = (message: string) => {
    if (!menteePhone) {
      toast.error("Telefone do mentorado não disponível");
      return;
    }

    const formattedPhone = formatPhoneForWhatsApp(menteePhone);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
  };

  const copyToClipboard = async (message: string, templateId: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedTemplate(templateId);
      toast.success("✅ Copiado!");
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const templates = [
    {
      id: "confirmation",
      icon: "📋",
      title: "Confirmação Inicial",
      description: "Envie logo após confirmar a mentoria",
      message: confirmationTemplate,
    },
    {
      id: "reminder",
      icon: "⏰",
      title: "Lembrete 24h Antes",
      description: "Envie 1 dia antes com link da reunião",
      message: reminderTemplate,
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-600" />
            <span className="font-medium text-foreground text-sm">Templates para WhatsApp</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Envie mensagens prontas com um clique:
                </p>

                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-card rounded-xl p-4 border border-border/50 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{template.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground">{template.title}</h5>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed border border-border/30">
                      {template.message}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => openWhatsApp(template.message)}
                        disabled={!menteePhone}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Enviar no WhatsApp
                      </Button>
                      
                      <Button
                        onClick={() => copyToClipboard(template.message, template.id)}
                        variant="outline"
                        className="border-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 h-11 px-4"
                      >
                        {copiedTemplate === template.id ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                  <Info className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>Você pode editar a mensagem antes de enviar!</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default WhatsAppTemplates;
