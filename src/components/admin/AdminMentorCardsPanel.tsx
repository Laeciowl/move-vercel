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
      {/* Card preview */}
      <div 
        ref={cardRef}
        className="relative rounded-2xl p-6 text-white overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(135deg, hsl(24.6, 95%, 53.1%) 0%, hsl(30, 90%, 55%) 50%, hsl(38, 92%, 50%) 100%)",
          width: "300px",
          height: "300px",
          aspectRatio: "1 / 1"
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
            style={{ border: "4px solid rgba(255,255,255,0.2)" }}
          />
          <div 
            className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full"
            style={{ border: "4px solid rgba(255,255,255,0.15)" }}
          />
          <div className="absolute top-6 left-6 w-1.5 h-1.5 rounded-full bg-white" />
          <div className="absolute top-12 right-12 w-2 h-2 rounded-full bg-white/80" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl">🧡</span>
            <div 
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              Mentor Movê
            </div>
          </div>
          
          {/* Mentor info */}
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
              style={{ 
                backgroundColor: "rgba(255,255,255,0.2)", 
                border: "2px solid rgba(255,255,255,0.4)"
              }}
            >
              {mentor.photo_url ? (
                <img
                  src={mentor.photo_url}
                  alt={mentor.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-base font-bold">
                  {mentor.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{mentor.name}</h3>
              <p style={{ color: "rgba(255,255,255,0.8)" }} className="text-xs">{mentor.area}</p>
            </div>
          </div>
          
          {/* Message */}
          <div className="flex-1 flex flex-col justify-center">
            <div 
              className="rounded-lg p-3"
              style={{ 
                backgroundColor: "rgba(255,255,255,0.15)", 
                border: "1px solid rgba(255,255,255,0.2)"
              }}
            >
              <p className="text-sm font-bold leading-snug mb-1">
                Venha agendar uma sessão de mentoria comigo sobre {mentor.area},
              </p>
              <p className="text-xs font-semibold" style={{ color: "#FDE68A" }}>
                e coloque sua carreira em movimento! 🚀
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div 
            className="flex items-center justify-between mt-3 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}
          >
            <div className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              movecarreiras.org
            </div>
            <div 
              className="font-bold px-2 py-0.5 rounded-full text-[10px]"
              style={{ backgroundColor: "white", color: "hsl(24.6, 95%, 53.1%)" }}
            >
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
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement("a");
      link.download = `mentor-move-${mentor.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
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
