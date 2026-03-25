import { useState, useRef } from "react";
import { Download, Linkedin, Copy, Check, Share2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useAuth } from "@/contexts/AuthContext";
import {
  cardContainerStyle,
  decorCircle1,
  decorCircle2,
  sparkle1,
  sparkle2,
} from "./shared/mentorCardStyles";

const LINKEDIN_POST_TEXT = `🚀 Agora sou mentorado(a) Movê!

Agora faço parte de uma rede que conecta quem quer crescer com quem já chegou lá. Com acesso a mentores experientes de diversas empresas, estou pronto(a) para mover minha carreira!

Se você também é um jovem profissional e quer direcionamento, venha pra Movê! 💜

O Movê é uma plataforma social de desenvolvimento profissional que conecta jovens a mentores de diversas áreas — tudo gratuito e movido por quem acredita no poder da orientação.

#Movê #Mentoria #DesenvolvimentoProfissional #CarreiraProfissional`;

const CARD_SIZE = 500;

interface MenteeLinkedInShareCardProps {
  /** Compact mode for inline display (e.g. onboarding screen) */
  compact?: boolean;
}

const MenteeLinkedInShareCard = ({ compact = false }: MenteeLinkedInShareCardProps) => {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const userName = profile?.name || "Mentorado(a)";
  const s = CARD_SIZE;

  const handleDownloadCard = async () => {
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
      link.download = `sou-mentorado-move-${userName.split(" ")[0].toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      toast.success("Card baixado! Agora poste nas redes 🎉");
    } catch {
      toast.error("Erro ao gerar imagem");
    } finally {
      setDownloading(false);
    }
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

  const handleOpenLinkedIn = async () => {
    // Download first so user has the image
    await handleDownloadCard();
    const url = "https://movecarreiras.org";
    setTimeout(() => {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        "_blank",
        "width=600,height=500"
      );
    }, 500);
  };

  const handleWhatsAppShare = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(LINKEDIN_POST_TEXT)}`, "_blank");
  };

  return (
    <div className={`border border-border/40 rounded-xl ${compact ? "p-4" : "p-5"} space-y-3 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.08)]`}>
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-primary" />
        <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
          {compact
            ? "Compartilhe nas redes que agora você é mentorado(a) Movê!"
            : "Compartilhe essa conquista e mostre que você é um mentorado(a) Movê!"}
        </p>
      </div>

      {/* HTML2Canvas Card — rendered inline but scrollable if needed */}
      <div className="flex justify-center">
        <div style={{ transform: `scale(${compact ? 0.58 : 0.7})`, transformOrigin: "top center", width: `${s}px`, height: `${s}px` }}>
          <div ref={cardRef} style={cardContainerStyle(s)}>
            <div style={decorCircle1(s)} />
            <div style={decorCircle2(s)} />
            <div style={sparkle1(s)} />
            <div style={sparkle2(s)} />

            <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span style={{ fontSize: "28px" }}>🚀</span>
                <div style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: "6px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: 600 }}>
                  Mentorado(a) Movê
                </div>
              </div>

              {/* User info */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "16px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
                  {profile?.photo_url ? (
                    <img src={profile.photo_url} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "bold" }}>
                      {userName.charAt(0)}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: "bold", fontSize: "22px", lineHeight: 1.3, margin: 0, wordWrap: "break-word", overflowWrap: "break-word", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                    {userName}
                  </h3>
                  <p style={{ color: "rgba(255,255,255,0.95)", fontSize: "14px", margin: "4px 0 0 0", lineHeight: 1.4, textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
                    Mentorado(a) Movê
                  </p>
                </div>
              </div>

              {/* Message box */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <p style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    margin: 0,
                    textAlign: "center",
                    width: "100%",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                  }}>
                    Agora faço parte de uma rede que conecta quem quer crescer com quem já chegou lá. Com acesso a mentores experientes de diversas empresas, estou pronto(a) para mover minha carreira! 🚀
                  </p>
                  <p style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    lineHeight: 1.4,
                    margin: "10px 0 0 0",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.85)",
                  }}>
                    Interessado(a)? Venha você também se inscrever na Movê!
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>movecarreiras.org</span>
                <div style={{ backgroundColor: "white", color: "#f97316", fontWeight: "bold", padding: "8px 16px", borderRadius: "20px", fontSize: "14px" }}>
                  Movê
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to account for scaled card */}
      <div style={{ marginTop: compact ? `-${s * 0.42}px` : `-${s * 0.3}px` }} />

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCard}
          disabled={downloading}
          className="flex-1 rounded-lg text-xs"
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
          {downloading ? "Gerando..." : "Baixar card"}
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
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleOpenLinkedIn}
          className="flex-1 rounded-lg text-xs bg-[#0A66C2] hover:bg-[#004182] text-white"
        >
          <Linkedin className="w-3.5 h-3.5 mr-1.5" />
          Postar no LinkedIn
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleWhatsAppShare}
          className="flex-1 rounded-lg text-xs border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
          WhatsApp
        </Button>
      </div>
    </div>
  );
};

export default MenteeLinkedInShareCard;
