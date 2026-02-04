import { useState } from "react";
import { MessageSquare, Copy, Check, Clock, Send, Info } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WhatsAppTemplatesProps {
  menteeName: string;
  menteePhone: string | null;
  scheduledAt: string;
  duration: number;
  objective: string | null;
}

const WhatsAppTemplates = ({
  menteeName,
  menteePhone,
  scheduledAt,
  duration,
  objective,
}: WhatsAppTemplatesProps) => {
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const firstName = menteeName.split(" ")[0];
  const sessionDate = new Date(scheduledAt);
  const fullDate = format(sessionDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const time = format(sessionDate, "HH:mm", { locale: ptBR });
  const durationText = `${duration || 30} minutos`;

  const confirmationTemplate = `Olá ${firstName}! 👋

Confirmando nossa mentoria:

📅 ${fullDate}
🕐 ${time} (horário de Brasília)
⏱️ ${durationText}

${objective ? `Vamos conversar sobre:
${objective}

` : ""}Vou criar o link da reunião e te envio até amanhã, ok?

Qualquer dúvida, estou por aqui!`;

  const reminderTemplate = `Oi ${firstName}! 😊

Lembrete: nossa mentoria é AMANHÃ às ${time}!

🎥 Link da reunião:
[Cole aqui o link do Google Meet/Zoom]

Confirma presença? 🚀`;

  const formatPhoneForWhatsApp = (phone: string): string => {
    // Remove all non-numeric characters
    const cleanPhone = phone.replace(/\D/g, "");
    
    // If it already starts with 55 and has 12-13 digits, use as is
    if (cleanPhone.startsWith("55") && cleanPhone.length >= 12) {
      return cleanPhone;
    }
    
    // Otherwise, add Brazil country code
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-green-600" />
        <h4 className="font-semibold text-foreground">Templates para WhatsApp</h4>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Envie mensagens prontas com um clique:
      </p>

      <div className="space-y-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-black/20 rounded-lg p-4 border border-green-100 dark:border-green-800 space-y-3"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{template.icon}</span>
              <div className="flex-1">
                <h5 className="font-medium text-foreground">{template.title}</h5>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
            </div>

            {/* Preview of message */}
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
              {template.message}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => openWhatsApp(template.message)}
                disabled={!menteePhone}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar no WhatsApp
              </Button>
              
              <Button
                onClick={() => copyToClipboard(template.message, template.id)}
                variant="outline"
                size="sm"
                className="border-green-300 hover:bg-green-50 dark:hover:bg-green-900/30"
              >
                {copiedTemplate === template.id ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Você pode editar a mensagem antes de enviar no WhatsApp!</span>
      </div>
    </motion.div>
  );
};

export default WhatsAppTemplates;
