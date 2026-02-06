import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Linkedin, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";

interface MentorCertificateProps {
  mentorName: string;
  mentorPhotoUrl: string | null;
  uniqueMentees: number;
  completedSessions: number;
  totalMinutes?: number;
}

const MentorCertificate = ({
  mentorName,
  mentorPhotoUrl,
  uniqueMentees,
  completedSessions,
  totalMinutes = 0,
}: MentorCertificateProps) => {
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const downloadPNG = async () => {
    if (!certRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 4,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `certificado-mentor-move-${mentorName.split(" ")[0].toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Error generating certificate:", err);
    }
    setGenerating(false);
  };

  const shareOnLinkedIn = async () => {
    // First download the PNG so the user has it ready to attach
    if (certRef.current) {
      setGenerating(true);
      try {
        const canvas = await html2canvas(certRef.current, {
          scale: 4,
          backgroundColor: null,
          useCORS: true,
          logging: false,
        });
        const link = document.createElement("a");
        link.download = `certificado-mentor-move-${mentorName.split(" ")[0].toLowerCase()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Error generating certificate:", err);
      }
      setGenerating(false);
    }

    const text = `🏆 Sou Mentor Movê!\n\nEu faço parte dos que movem a sociedade.\n\n📊 ${completedSessions} mentorias realizadas\n🌱 ${uniqueMentees} vidas impactadas\n⏱️ ${totalMinutes} minutos transformando vidas\n\nO Movê é um hub gratuito de orientação profissional para jovens. Se você quer transformar vidas doando seu tempo e conhecimento, venha fazer parte!\n\n#MentorMovê #Mentoria #ImpactoSocial #Voluntariado`;
    const url = "https://movesocial.lovable.app";
    setTimeout(() => {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
        "_blank",
        "width=600,height=500"
      );
    }, 500);
  };

  if (!showPreview) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 border border-primary/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Certificado de Mentor</p>
              <p className="text-xs text-muted-foreground">Baixe e compartilhe seu impacto</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
          >
            Ver certificado
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Certificate Card */}
      <div
        ref={certRef}
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: "100%",
          maxWidth: 520,
          aspectRatio: "1/1",
          background: "linear-gradient(145deg, #1a0a00 0%, #2d1200 30%, #4a1e00 60%, #1a0a00 100%)",
        }}
      >
        {/* Decorative orbs */}
        <div
          className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #f97316, transparent 65%)", transform: "translate(25%, -25%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #fb923c, transparent 65%)", transform: "translate(-15%, 15%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f97316, transparent 60%)", transform: "translate(-50%, -50%)" }}
        />

        {/* Border accent */}
        <div className="absolute inset-0 rounded-2xl" style={{ border: "1px solid rgba(249, 115, 22, 0.2)" }} />

        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
          {/* Title */}
          <div className="mb-5">
            <p className="text-[10px] tracking-[0.4em] uppercase font-semibold mb-1.5" style={{ color: "#fb923c" }}>Certificado</p>
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: "#fff" }}>
              MENTOR <span style={{ color: "#f97316" }}>MOVÊ</span>
            </h2>
          </div>

          {/* Photo */}
          <div className="w-28 h-28 rounded-full overflow-hidden mb-4 shadow-2xl" style={{ border: "3px solid #f97316", boxShadow: "0 0 30px rgba(249, 115, 22, 0.3)" }}>
            {mentorPhotoUrl ? (
              <img src={mentorPhotoUrl} alt={mentorName} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(249, 115, 22, 0.15)" }}>
                <Award className="w-10 h-10" style={{ color: "#f97316" }} />
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold mb-1" style={{ color: "#fff" }}>{mentorName}</h3>

          {/* Quote */}
          <p className="text-sm italic mb-6 max-w-xs leading-relaxed" style={{ color: "rgba(251, 146, 60, 0.85)" }}>
            "Eu faço parte dos que movem a sociedade."
          </p>

          {/* Impact metrics - vertical stack */}
          <div className="w-full max-w-xs space-y-3 mb-6">
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.15)" }}>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(251, 146, 60, 0.7)" }}>Mentorias realizadas</span>
              <span className="text-2xl font-extrabold" style={{ color: "#f97316" }}>{completedSessions}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.15)" }}>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(251, 146, 60, 0.7)" }}>Vidas impactadas</span>
              <span className="text-2xl font-extrabold" style={{ color: "#f97316" }}>{uniqueMentees}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl" style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.15)" }}>
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(251, 146, 60, 0.7)" }}>Min. transformando vidas</span>
              <span className="text-2xl font-extrabold" style={{ color: "#f97316" }}>{totalMinutes}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <p className="text-lg font-extrabold" style={{ color: "#f97316" }}>Movê</p>
            <p className="text-[9px] mt-0.5" style={{ color: "rgba(251, 146, 60, 0.5)" }}>
              Hub gratuito de orientação profissional para jovens
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={downloadPNG}
          disabled={generating}
          size="sm"
          className="gap-2 rounded-xl bg-primary hover:bg-primary/90"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Baixar PNG
        </Button>
        <Button
          onClick={shareOnLinkedIn}
          disabled={generating}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/10"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Linkedin className="w-4 h-4" />}
          Compartilhar no LinkedIn
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPreview(false)}
          className="rounded-xl text-muted-foreground"
        >
          Fechar
        </Button>
      </div>
    </motion.div>
  );
};

export default MentorCertificate;
