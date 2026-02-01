import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

interface Mentor {
  id: string;
  name: string;
  area: string;
  photo_url: string | null;
  status: "pending" | "approved" | "rejected";
}

const MentorCard = ({ mentor, onDownload }: { mentor: Mentor; onDownload: (mentor: Mentor, ref: HTMLDivElement) => void }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await onDownload(mentor, cardRef.current);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Card preview - Fixed dimensions for PNG export */}
      <div 
        ref={cardRef}
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #f59e0b 100%)",
          width: "400px",
          height: "400px",
          padding: "24px",
          borderRadius: "20px",
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
          top: "-32px",
          right: "-32px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          border: "5px solid rgba(255,255,255,0.2)"
        }} />
        <div style={{
          position: "absolute",
          bottom: "-48px",
          left: "-48px",
          width: "160px",
          height: "160px",
          borderRadius: "50%",
          border: "5px solid rgba(255,255,255,0.15)"
        }} />
        {/* Sparkle dots */}
        <div style={{
          position: "absolute",
          top: "24px",
          left: "24px",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "white"
        }} />
        <div style={{
          position: "absolute",
          top: "48px",
          right: "48px",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.8)"
        }} />
        
        {/* Content */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>🧡</span>
            <div style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              padding: "4px 12px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: 600
            }}>
              Mentor Movê
            </div>
          </div>
          
          {/* Mentor info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              overflow: "hidden",
              backgroundColor: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.4)",
              flexShrink: 0
            }}>
              {mentor.photo_url ? (
                <img
                  src={mentor.photo_url}
                  alt={mentor.name}
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
                  fontSize: "20px",
                  fontWeight: "bold"
                }}>
                  {mentor.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 style={{ fontWeight: "bold", fontSize: "18px", lineHeight: 1.2, margin: 0 }}>{mentor.name}</h3>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "13px", margin: "2px 0 0 0" }}>{mentor.area}</p>
            </div>
          </div>
          
          {/* Message box */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid rgba(255,255,255,0.2)"
            }}>
              <p style={{ fontSize: "16px", fontWeight: "bold", lineHeight: 1.4, margin: "0 0 6px 0" }}>
                Venha agendar uma sessão de mentoria comigo sobre {mentor.area},
              </p>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#FDE68A", margin: 0 }}>
                e coloque sua carreira em movimento! 🚀
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(255,255,255,0.2)"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
              movecarreiras.org
            </span>
            <div style={{
              backgroundColor: "white",
              color: "#f97316",
              fontWeight: "bold",
              padding: "6px 12px",
              borderRadius: "16px",
              fontSize: "12px"
            }}>
              O Movê
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <Button
        size="sm"
        className="w-full gap-2"
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {downloading ? "Gerando..." : "Baixar PNG"}
      </Button>
    </div>
  );
};

const AdminMentorCardsPanel = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMentors = async () => {
    const { data, error } = await supabase
      .from("mentors")
      .select("id, name, area, photo_url, status")
      .eq("status", "approved")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar mentores");
      console.error(error);
    } else {
      setMentors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleDownload = async (mentor: Mentor, element: HTMLDivElement) => {
    try {
      const canvas = await html2canvas(element, {
        scale: 4, // Higher resolution for crisp PNG (800x800 output)
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      const link = document.createElement("a");
      link.download = `mentor-move-${mentor.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png", 1.0); // Maximum quality
      link.click();
      
      toast.success(`Card de ${mentor.name} baixado!`);
    } catch (err) {
      console.error("Error generating image:", err);
      toast.error("Erro ao gerar imagem");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Cards de Mentores ({mentors.length})</h3>
        <p className="text-sm text-muted-foreground">
          Baixe os cards de divulgação para enviar aos mentores
        </p>
      </div>
      
      {mentors.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum mentor aprovado</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMentorCardsPanel;
