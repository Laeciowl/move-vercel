import { useState } from "react";
import { Share2, MessageCircle, Linkedin, Copy, Check, Sparkles } from "lucide-react";
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

  const profileUrl = `https://movecarreiras.org/mentores?mentor=${mentorId}`;
  
  const shareText = `🧡 Sou mentor(a) voluntário(a) no Movê!\n\nVenha agendar uma sessão de mentoria comigo sobre ${mentorArea}, e coloque sua carreira em movimento! 🚀\n\n👉 ${profileUrl}`;
  
  const linkedinShareText = `🧡 Sou mentor(a) voluntário(a) no Movê!\n\nO Movê é uma plataforma gratuita que conecta jovens a mentores voluntários para ajudá-los a dar os próximos passos na carreira.\n\nVenha agendar uma sessão de mentoria comigo sobre ${mentorArea}, e coloque sua carreira em movimento! 🚀`;

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
              className="justify-start gap-2 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2 text-[#0A66C2] hover:text-[#0A66C2] hover:bg-[#0A66C2]/10"
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
                <Check className="w-4 h-4 text-primary" />
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
              <Sparkles className="w-4 h-4" />
              Ver arte para compartilhar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Art Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Arte para compartilhar</DialogTitle>
          </DialogHeader>
          
          {/* Share Card Art - Larger and more creative */}
          <div className="relative bg-gradient-to-br from-primary via-orange-500 to-amber-400 rounded-3xl p-8 text-white overflow-hidden min-h-[400px] flex flex-col">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Large circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 border-[6px] border-white/20 rounded-full" />
              <div className="absolute -bottom-16 -left-16 w-56 h-56 border-[6px] border-white/15 rounded-full" />
              <div className="absolute top-1/3 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
              {/* Sparkle dots */}
              <div className="absolute top-8 left-8 w-2 h-2 bg-white rounded-full animate-pulse" />
              <div className="absolute top-16 right-16 w-3 h-3 bg-white/80 rounded-full animate-pulse delay-100" />
              <div className="absolute bottom-24 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse delay-200" />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Header with emoji and brand */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl">🧡</span>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">
                  Mentor Movê
                </div>
              </div>
              
              {/* Mentor photo and info */}
              <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 border-3 border-white/40 shrink-0 shadow-lg">
                  {mentorPhotoUrl ? (
                    <img
                      src={mentorPhotoUrl}
                      alt={mentorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                      {mentorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-2xl leading-tight">{mentorName}</h3>
                  <p className="text-white/80 text-base">{mentorArea}</p>
                </div>
              </div>
              
              {/* Main message - larger and more impactful */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                  <p className="text-2xl font-bold leading-snug mb-3">
                    Venha agendar uma sessão de mentoria comigo sobre {mentorArea},
                  </p>
                  <p className="text-xl font-semibold text-amber-200">
                    e coloque sua carreira em movimento! 🚀
                  </p>
                </div>
              </div>
              
              {/* Footer with URL and brand */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                <div className="text-sm text-white/70 font-medium">
                  movecarreiras.org
                </div>
                <div className="bg-white text-primary font-bold px-4 py-1.5 rounded-full text-sm shadow-lg">
                  O Movê
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center mt-3">
            Tire um print desta arte ou compartilhe diretamente pelos botões abaixo
          </p>
          
          <div className="flex gap-3 mt-2">
            <Button
              className="flex-1 bg-[#25D366] hover:bg-[#25D366]/90 gap-2"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              className="flex-1 bg-[#0A66C2] hover:bg-[#0A66C2]/90 gap-2"
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
