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
import {
  getDefaultMessage,
  getDisplayMessage,
  truncateName,
  truncateArea,
  cardContainerStyle,
  decorCircle1,
  decorCircle2,
  sparkle1,
  sparkle2,
} from "./shared/mentorCardStyles";

interface MentorShareButtonProps {
  mentorId: string;
  mentorName: string;
  mentorArea: string;
  mentorPhotoUrl?: string | null;
}

const CARD_SIZE = 500;

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

  const displayMessage = getDisplayMessage(cardMessage, mentorArea);

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
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    } catch {
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

  const s = CARD_SIZE;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
            <Share2 className="w-4 h-4" />
            Compartilhar perfil
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="end">
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="sm" className="justify-start gap-2 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10" onClick={handleWhatsAppShare}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-2 text-[#0A66C2] hover:text-[#0A66C2] hover:bg-[#0A66C2]/10" onClick={handleLinkedInShare}>
              <Linkedin className="w-4 h-4" /> LinkedIn
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={handleCopyLink}>
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
            <div className="border-t my-1" />
            <Button variant="ghost" size="sm" className="justify-start gap-2 text-primary" onClick={() => setShowPreview(true)}>
              <Sparkles className="w-4 h-4" /> Ver arte para compartilhar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Arte para compartilhar</DialogTitle>
          </DialogHeader>

          {/* Card */}
          <div ref={cardRef} style={cardContainerStyle(s)}>
            <div style={decorCircle1(s)} />
            <div style={decorCircle2(s)} />
            <div style={sparkle1(s)} />
            <div style={sparkle2(s)} />

            <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "28px" }}>🧡</span>
                <div style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: 600 }}>
                  Mentor Movê
                </div>
              </div>

              {/* Mentor info */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "16px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
                  {mentorPhotoUrl ? (
                    <img src={mentorPhotoUrl} alt={mentorName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "bold" }}>
                      {mentorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: "bold", fontSize: "22px", lineHeight: 1.3, margin: 0, wordWrap: "break-word", overflowWrap: "break-word", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                    {mentorName}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "14px", margin: "4px 0 0 0", lineHeight: 1.4, wordWrap: "break-word", overflowWrap: "break-word", textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                    {mentorArea}
                  </p>
                </div>
              </div>

              {/* Message box — fixed height with text clamping */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  height: "160px",
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                }}>
                  <p style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    margin: 0,
                    textAlign: "center",
                    width: "100%",
                    display: "-webkit-box",
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {displayMessage}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>movecarreiras.org</span>
                <div style={{ backgroundColor: "white", color: "#f97316", fontWeight: "bold", padding: "8px 16px", borderRadius: "20px", fontSize: "14px" }}>
                  O Movê
                </div>
              </div>
            </div>
          </div>

          {/* Edit / info */}
          {editing ? (
            <div className="space-y-2 mt-3">
              <Textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} placeholder={getDefaultMessage(mentorArea)} rows={4} className="text-sm" maxLength={220} />
              <p className="text-xs text-muted-foreground">Máximo 220 caracteres. Deixe em branco para usar a mensagem padrão.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveMessage} disabled={saving} className="gap-1">
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />} Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-muted-foreground">Baixe a imagem e compartilhe nas suas redes sociais</p>
              <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={handleStartEdit}>
                <Pencil className="w-3 h-3" /> Editar texto
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-2">
            <Button className="w-full bg-gradient-hero gap-2" onClick={handleDownloadImage} disabled={downloading}>
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Gerando imagem..." : "Baixar imagem PNG"}
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 gap-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10" onClick={handleWhatsAppShare}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
              <Button variant="outline" className="flex-1 gap-2 border-[#0A66C2] text-[#0A66C2] hover:bg-[#0A66C2]/10" onClick={handleLinkedInShare}>
                <Linkedin className="w-4 h-4" /> LinkedIn
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MentorShareButton;
