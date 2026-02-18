import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import {
  getDisplayMessage,
  truncateName,
  truncateArea,
  cardContainerStyle,
  decorCircle1,
  decorCircle2,
  sparkle1,
  sparkle2,
} from "@/components/shared/mentorCardStyles";

interface Mentor {
  id: string;
  name: string;
  area: string;
  photo_url: string | null;
  status: "pending" | "approved" | "rejected";
  card_message: string | null;
}

const CARD_SIZE = 400;

const MentorCard = ({ mentor, onDownload }: { mentor: Mentor; onDownload: (mentor: Mentor, ref: HTMLDivElement) => void }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const s = CARD_SIZE;
  const displayMessage = getDisplayMessage(mentor.card_message, mentor.area);

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
      <div ref={cardRef} style={cardContainerStyle(s)}>
        <div style={decorCircle1(s)} />
        <div style={decorCircle2(s)} />
        <div style={sparkle1(s)} />
        <div style={sparkle2(s)} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "22px" }}>🧡</span>
            <div style={{ backgroundColor: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 600 }}>
              Mentor Movê
            </div>
          </div>

          {/* Mentor info — fixed height */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", height: "56px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "12px", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", flexShrink: 0 }}>
              {mentor.photo_url ? (
                <img src={mentor.photo_url} alt={mentor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold" }}>
                  {mentor.name.charAt(0)}
                </div>
              )}
            </div>
            <div style={{ overflow: "hidden" }}>
              <h3 style={{ fontWeight: "bold", fontSize: "16px", lineHeight: 1.2, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "240px" }}>
                {truncateName(mentor.name)}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", margin: "2px 0 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "240px" }}>
                {truncateArea(mentor.area)}
              </p>
            </div>
          </div>

          {/* Message box — fixed height */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: "12px",
              padding: "14px",
              border: "1px solid rgba(255,255,255,0.2)",
              height: "130px",
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
            }}>
              <p style={{
                fontSize: "13px",
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>movecarreiras.org</span>
            <div style={{ backgroundColor: "white", color: "#f97316", fontWeight: "bold", padding: "5px 12px", borderRadius: "16px", fontSize: "11px" }}>
              O Movê
            </div>
          </div>
        </div>
      </div>

      <Button size="sm" className="w-full gap-2" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
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
      .select("id, name, area, photo_url, status, card_message")
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
        scale: 4,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `mentor-move-${mentor.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
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
