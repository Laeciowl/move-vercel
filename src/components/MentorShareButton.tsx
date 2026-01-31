import { useState, useRef } from "react";
import { Share2, MessageCircle, Linkedin, Copy, Check, Sparkles, Download, Loader2 } from "lucide-react";
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
import html2canvas from "html2canvas";

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
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const profileUrl = `https://movecarreiras.org/mentores?mentor=${mentorId}`;
  
  const shareText = `🧡 Sou mentor(a) voluntário(a) no Movê!\n\nVenha agendar uma sessão de mentoria comigo sobre ${mentorArea}, e coloque sua carreira em movimento! 🚀\n\n👉 ${profileUrl}`;

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

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher resolution
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement("a");
      link.download = `mentor-move-${mentorName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Imagem baixada com sucesso!");
    } catch (err) {
      console.error("Error generating image:", err);
      toast.error("Erro ao gerar imagem");
    } finally {
      setDownloading(false);
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
          
          {/* Share Card Art - Square aspect ratio for social media */}
          <div 
            ref={cardRef}
            className="relative rounded-3xl p-8 text-white overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(135deg, hsl(24.6, 95%, 53.1%) 0%, hsl(30, 90%, 55%) 50%, hsl(38, 92%, 50%) 100%)",
              width: "400px",
              height: "400px",
              aspectRatio: "1 / 1"
            }}
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Large circles */}
              <div 
                className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
                style={{ border: "6px solid rgba(255,255,255,0.2)" }}
              />
              <div 
                className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full"
                style={{ border: "6px solid rgba(255,255,255,0.15)" }}
              />
              <div 
                className="absolute top-1/3 -right-8 w-24 h-24 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", filter: "blur(20px)" }}
              />
              {/* Sparkle dots */}
              <div 
                className="absolute top-8 left-8 w-2 h-2 rounded-full"
                style={{ backgroundColor: "white" }}
              />
              <div 
                className="absolute top-16 right-16 w-3 h-3 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.8)" }}
              />
              <div 
                className="absolute bottom-24 left-1/4 w-2 h-2 rounded-full"
                style={{ backgroundColor: "white" }}
              />
              {/* Gradient overlay */}
              <div 
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.2), transparent)" }}
              />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              {/* Header with emoji and brand */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">🧡</span>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                >
                  Mentor Movê
                </div>
              </div>
              
              {/* Mentor photo and info */}
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.2)", 
                    border: "3px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
                  }}
                >
                  {mentorPhotoUrl ? (
                    <img
                      src={mentorPhotoUrl}
                      alt={mentorName}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                      {mentorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xl leading-tight">{mentorName}</h3>
                  <p style={{ color: "rgba(255,255,255,0.8)" }} className="text-sm">{mentorArea}</p>
                </div>
              </div>
              
              {/* Main message */}
              <div className="flex-1 flex flex-col justify-center">
                <div 
                  className="rounded-xl p-4"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.15)", 
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.2)"
                  }}
                >
                  <p className="text-lg font-bold leading-snug mb-2">
                    Venha agendar uma sessão de mentoria comigo sobre {mentorArea},
                  </p>
                  <p className="text-base font-semibold" style={{ color: "#FDE68A" }}>
                    e coloque sua carreira em movimento! 🚀
                  </p>
                </div>
              </div>
              
              {/* Footer with URL and brand */}
              <div 
                className="flex items-center justify-between mt-4 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}
              >
                <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  movecarreiras.org
                </div>
                <div 
                  className="font-bold px-3 py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: "white", 
                    color: "hsl(24.6, 95%, 53.1%)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                  }}
                >
                  O Movê
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center mt-3">
            Baixe a imagem e compartilhe nas suas redes sociais
          </p>
          
          <div className="flex flex-col gap-3 mt-2">
            {/* Download button - Primary action */}
            <Button
              className="w-full bg-gradient-hero gap-2"
              onClick={handleDownloadImage}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloading ? "Gerando imagem..." : "Baixar imagem PNG"}
            </Button>
            
            {/* Share buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                onClick={handleWhatsAppShare}
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10"
                onClick={handleLinkedInShare}
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MentorShareButton;
