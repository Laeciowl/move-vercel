import { useState } from "react";
import { Share2, MessageCircle, Linkedin, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface MentorShareButtonProps {
  mentorId: string;
  mentorName: string;
  mentorArea: string;
  mentorPhotoUrl?: string | null;
}

const MentorShareButton = ({
  mentorId,
  mentorName,
  mentorArea,
  mentorPhotoUrl,
}: MentorShareButtonProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileUrl = `https://movesocial.lovable.app/mentores?mentor=${mentorId}`;
  
  const shareText = `🧡 Sou mentor(a) voluntário(a) no Movê!\n\nVenha agendar uma sessão de mentoria comigo sobre ${mentorArea}.\n\n👉 ${profileUrl}`;
  
  const linkedinShareText = `🧡 Sou mentor(a) voluntário(a) no Movê!\n\nO Movê é uma plataforma gratuita que conecta jovens a mentores voluntários para ajudá-los a dar os próximos passos na carreira.\n\nVenha agendar uma sessão de mentoria comigo sobre ${mentorArea}! 🚀`;

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(linkedinUrl, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar link");
    }
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar perfil
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="end">
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={handleLinkedInShare}
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
            <div className="border-t my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 text-primary"
              onClick={() => setShowPreview(true)}
            >
              <Share2 className="w-4 h-4" />
              Ver arte para compartilhar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Art Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Arte para compartilhar</DialogTitle>
          </DialogHeader>
          
          {/* Share Card Art */}
          <div className="relative bg-gradient-to-br from-primary via-orange-500 to-amber-500 rounded-2xl p-6 text-white overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 border-4 border-white rounded-full" />
              <div className="absolute bottom-4 right-4 w-32 h-32 border-4 border-white rounded-full" />
              <div className="absolute top-1/2 right-1/4 w-16 h-16 border-4 border-white rounded-full" />
            </div>
            
            <div className="relative z-10">
              {/* Mentor photo */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 border-2 border-white/50 shrink-0">
                  {mentorPhotoUrl ? (
                    <img
                      src={mentorPhotoUrl}
                      alt={mentorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                      {mentorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{mentorName}</h3>
                  <p className="text-white/80 text-sm">{mentorArea}</p>
                </div>
              </div>
              
              {/* Main message */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <p className="text-xl font-bold leading-snug">
                  🧡 Sou mentor(a) voluntário(a) no Movê!
                </p>
                <p className="text-white/90 mt-2">
                  Venha agendar uma sessão de mentoria comigo
                </p>
              </div>
              
              {/* Logo / Brand */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">
                  movesocial.lovable.app
                </div>
                <div className="bg-white text-primary font-bold px-3 py-1 rounded-full text-sm">
                  O Movê
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center mt-2">
            Tire um print desta arte ou compartilhe diretamente pelos botões abaixo
          </p>
          
          <div className="flex gap-2 mt-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
              onClick={handleLinkedInShare}
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MentorShareButton;
