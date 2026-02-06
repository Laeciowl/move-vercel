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
}

const MentorCertificate = ({
  mentorName,
  mentorPhotoUrl,
  uniqueMentees,
  completedSessions,
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

    const text = `🏆 Sou Mentor Movê!\n\nEu faço parte dos que movem a sociedade.\n\n📊 ${completedSessions} mentorias realizadas\n🌱 ${uniqueMentees} vidas impactadas\n\nO Movê é um hub gratuito de orientação profissional para jovens. Se você quer transformar vidas doando seu tempo e conhecimento, venha fazer parte!\n\n#MentorMovê #Mentoria #ImpactoSocial #Voluntariado`;
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowPreview(true)}
        className="gap-2 rounded-xl"
      >
        <Award className="w-4 h-4 text-primary" />
        Meu Certificado
      </Button>
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
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
        }}
      >
        {/* Decorative elements */}
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #f97316, transparent 70%)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #f97316, transparent 70%)", transform: "translate(-20%, 20%)" }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
          {/* Title */}
          <div className="mb-4">
            <p className="text-xs tracking-[0.3em] uppercase text-orange-300/70 font-medium mb-1">Certificado</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              MENTOR <span style={{ color: "#f97316" }}>MOVÊ</span>
            </h2>
          </div>

          {/* Photo */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500/40 mb-4 shadow-xl">
            {mentorPhotoUrl ? (
              <img src={mentorPhotoUrl} alt={mentorName} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full bg-orange-500/20 flex items-center justify-center">
                <Award className="w-10 h-10 text-orange-400" />
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="text-xl font-bold text-white mb-2">{mentorName}</h3>

          {/* Quote */}
          <p className="text-sm text-orange-200/80 italic mb-6 max-w-xs leading-relaxed">
            Eu faço parte dos que movem a sociedade.
          </p>

          {/* Impact metrics */}
          <div className="flex gap-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-white">{completedSessions}</div>
              <div className="text-[10px] text-orange-300/70 uppercase tracking-wider mt-0.5">mentorias realizadas</div>
            </div>
            <div className="w-px bg-orange-500/30" />
            <div className="text-center">
              <div className="text-3xl font-extrabold text-white">{uniqueMentees}</div>
              <div className="text-[10px] text-orange-300/70 uppercase tracking-wider mt-0.5">vidas impactadas</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <p className="text-lg font-bold" style={{ color: "#f97316" }}>Movê</p>
            <p className="text-[9px] text-gray-400 mt-0.5">
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
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/10"
        >
          <Linkedin className="w-4 h-4" />
          LinkedIn
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
