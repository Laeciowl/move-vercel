import { useState, useRef, useEffect, useCallback } from "react";
import { Share2, MessageCircle, Linkedin, Copy, Check, Sparkles, Download, Loader2, Pencil } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";

interface MentorShareButtonProps {
  mentorId: string;
  mentorName: string;
  mentorArea: string;
  mentorPhotoUrl?: string | null;
}

const DEFAULT_MESSAGE = (area: string) =>
  `Venha agendar uma sessão de mentoria comigo sobre ${area}, e coloque sua carreira em movimento! 🚀`;

const MentorShareButton = ({
  mentorId,
  mentorName,
  mentorArea,
  mentorPhotoUrl,
}: MentorShareButtonProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cardMessage, setCardMessage] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const displayMessage = cardMessage || DEFAULT_MESSAGE(mentorArea);

  const fetchCardMessage = useCallback(async () => {
    const { data } = await supabase
      .from("mentors")
      .select("card_message")
      .eq("id", mentorId)
      .maybeSingle();
    if (data?.card_message) {
      setCardMessage(data.card_message);
    }
  }, [mentorId]);

  useEffect(() => {
    fetchCardMessage();
  }, [fetchCardMessage]);

  const profileUrl = `https://movecarreiras.org/mentores?mentor=${mentorId}`;
  
  const shareText = `🧡 Sou mentor(a) voluntário(a) no Movê!\n\n${displayMessage}\n\n👉 ${profileUrl}`;

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
        scale: 4,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      const link = document.createElement("a");
      link.download = `mentor-move-${mentorName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      
      toast.success("Imagem baixada com sucesso!");
    } catch (err) {
      console.error("Error generating image:", err);
      toast.error("Erro ao gerar imagem");
    } finally {
      setDownloading(false);
    }
  };

  const handleStartEdit = () => {
    setEditDraft(cardMessage || "");
    setEditing(true);
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    const value = editDraft.trim() || null;
    const { error } = await supabase
      .from("mentors")
      .update({ card_message: value })
      .eq("id", mentorId);
    if (error) {
      toast.error("Erro ao salvar mensagem");
    } else {
      setCardMessage(value);
      setEditing(false);
      toast.success("Mensagem do card atualizada!");
    }
    setSaving(false);
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
          
          {/* Share Card Art - Fixed square for PNG export */}
          <div 
            ref={cardRef}
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #f59e0b 100%)",
              width: "500px",
              height: "500px",
              padding: "32px",
              borderRadius: "24px",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              color: "white",
              fontFamily: "system-ui, -apple-system, sans-serif"
            }}
          >
            {/* Decorative circles */}
            <div style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              border: "6px solid rgba(255,255,255,0.2)"
            }} />
            <div style={{
              position: "absolute",
              bottom: "-60px",
              left: "-60px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              border: "6px solid rgba(255,255,255,0.15)"
            }} />
            {/* Sparkle dots */}
            <div style={{
              position: "absolute",
              top: "32px",
              left: "32px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "white"
            }} />
            <div style={{
              position: "absolute",
              top: "64px",
              right: "64px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.8)"
            }} />
            
            {/* Content */}
            <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <span style={{ fontSize: "28px" }}>🧡</span>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: 600
                }}>
                  Mentor Movê
                </div>
              </div>
              
              {/* Mentor info */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  border: "3px solid rgba(255,255,255,0.4)",
                  flexShrink: 0
                }}>
                  {mentorPhotoUrl ? (
                    <img
                      src={mentorPhotoUrl}
                      alt={mentorName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div style={{ 
                      width: "100%", 
                      height: "100%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      fontSize: "28px",
                      fontWeight: "bold"
                    }}>
                      {mentorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 style={{ fontWeight: "bold", fontSize: "24px", lineHeight: 1.2, margin: 0 }}>{mentorName}</h3>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", margin: "4px 0 0 0" }}>{mentorArea}</p>
                </div>
              </div>
              
              {/* Message box */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <p style={{ fontSize: "16px", fontWeight: "bold", lineHeight: 1.5, margin: 0 }}>
                    {displayMessage}
                  </p>
                </div>
              </div>
              
              {/* Footer */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.2)"
              }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
                  movecarreiras.org
                </span>
                <div style={{
                  backgroundColor: "white",
                  color: "#f97316",
                  fontWeight: "bold",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "14px"
                }}>
                  O Movê
                </div>
              </div>
            </div>
          </div>
          
          {/* Edit message section */}
          {editing ? (
            <div className="space-y-2 mt-3">
              <Textarea
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                placeholder={DEFAULT_MESSAGE(mentorArea)}
                rows={4}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">Deixe em branco para usar a mensagem padrão.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveMessage} disabled={saving} className="gap-1">
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-muted-foreground">
                Baixe a imagem e compartilhe nas suas redes sociais
              </p>
              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={handleStartEdit}>
                <Pencil className="w-3 h-3" />
                Editar texto
              </Button>
            </div>
          )}
          
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
