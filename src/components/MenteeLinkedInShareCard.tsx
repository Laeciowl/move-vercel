import { useState, useRef } from "react";
import { Download, Linkedin, Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import menteeShareCard from "@/assets/mentee-share-card.jpg";

const LINKEDIN_POST_TEXT = `🚀 Agora sou mentorado(a) Movê!

Feliz em fazer parte de uma rede do bem, com acesso a mentores voluntários do mercado prontos para me ajudar a mover minha carreira!

O @Movê é uma plataforma social de desenvolvimento profissional que conecta jovens a mentores de diversas áreas — tudo gratuito e movido por quem acredita no poder da orientação.

Bora mover juntos? 💜

#Movê #Mentoria #DesenvolvimentoProfissional #RedeDosBem #CarreiraProfissional`;

const LINKEDIN_MOVE_URL = "https://www.linkedin.com/company/movesocial";

const MenteeLinkedInShareCard = () => {
  const [copied, setCopied] = useState(false);

  const handleDownloadCard = () => {
    const link = document.createElement("a");
    link.href = menteeShareCard;
    link.download = "sou-mentorado-move.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Card baixado! Agora poste no LinkedIn 🎉");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(LINKEDIN_POST_TEXT);
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar texto");
    }
  };

  const handleOpenLinkedIn = () => {
    const encodedText = encodeURIComponent(LINKEDIN_POST_TEXT);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://movesocial.lovable.app")}&summary=${encodedText}`,
      "_blank"
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-semibold text-foreground">
          Compartilhe nas redes que agora você é mentorado(a) Movê!
        </p>
      </div>

      {/* Card preview */}
      <div className="rounded-lg overflow-hidden border border-border/30 shadow-sm">
        <img
          src={menteeShareCard}
          alt="Card: Sou Mentorado Movê"
          className="w-full h-auto"
          loading="lazy"
          width={1200}
          height={628}
        />
      </div>

      {/* Pre-written text preview */}
      <div className="bg-white dark:bg-background/50 rounded-lg p-3 border border-border/30">
        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed line-clamp-4">
          {LINKEDIN_POST_TEXT}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCard}
          className="flex-1 rounded-lg text-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Baixar card
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyText}
          className="flex-1 rounded-lg text-xs"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 mr-1.5" />
          )}
          {copied ? "Copiado!" : "Copiar texto"}
        </Button>
        <Button
          size="sm"
          onClick={handleOpenLinkedIn}
          className="flex-1 rounded-lg text-xs bg-[#0A66C2] hover:bg-[#004182] text-white"
        >
          <Linkedin className="w-3.5 h-3.5 mr-1.5" />
          Postar no LinkedIn
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Marque a <a href={LINKEDIN_MOVE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Movê no LinkedIn</a> no seu post! 💜
      </p>
    </div>
  );
};

export default MenteeLinkedInShareCard;
