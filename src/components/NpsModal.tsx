import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMentorCheck } from "@/hooks/useMentorCheck";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { toast } from "sonner";
import { X } from "lucide-react";

interface NpsModalProps {
  forceShow?: boolean;
}

const NpsModal = ({ forceShow = false }: NpsModalProps) => {
  const { user } = useAuth();
  const { isMentor } = useMentorCheck();
  const { isVolunteer } = useVolunteerCheck();
  const location = useLocation();
  const [visible, setVisible] = useState(forceShow);
  const [nota, setNota] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [motivo, setMotivo] = useState("");
  const [melhoria, setMelhoria] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userType = (isVolunteer || isMentor) ? "mentor" : "mentorado";

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    if (!user) return;
    checkShouldShow();
  }, [user, isMentor, isVolunteer, forceShow]);

  useEffect(() => {
    if (location.hash === "#nps" && user) {
      setVisible(true);
    }
  }, [location.hash, user]);

  const checkShouldShow = async () => {
    if (!user) return;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: recentNps } = await supabase
      .from("nps_respostas")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", ninetyDaysAgo.toISOString())
      .limit(1);

    if (recentNps && recentNps.length > 0) return;

    if (userType === "mentorado") {
      const { data: completedSessions } = await supabase
        .from("mentor_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed");

      if ((completedSessions?.length || 0) >= 2) {
        setVisible(true);
        return;
      }

      const { data: completedTrails } = await supabase
        .from("progresso_trilha")
        .select("id")
        .eq("mentorado_id", user.id)
        .not("concluido_em", "is", null)
        .limit(1);

      if (completedTrails && completedTrails.length > 0) {
        setVisible(true);
        return;
      }
    } else {
      const { data: mentorData } = await supabase
        .from("mentors")
        .select("sessions_completed_count")
        .eq("email", user.email || "")
        .maybeSingle();

      if (mentorData && mentorData.sessions_completed_count >= 5) {
        setVisible(true);
        return;
      }
    }
  };

  const getFeedbackPrompt = () => {
    if (nota === null) return "";
    if (nota <= 6) return "O que podemos melhorar para você dar nota 10?";
    if (nota <= 8) return "O que está faltando para ser 10?";
    return "Que bom! O que você mais gosta no Movê?";
  };

  const handleSubmit = async () => {
    if (!user || nota === null) return;
    setSubmitting(true);

    await supabase
      .from("nps_respostas")
      .delete()
      .eq("user_id", user.id);

    const feedbackParts: string[] = [];
    if (motivo) feedbackParts.push(`Motivo: ${motivo}`);
    if (feedback) feedbackParts.push(`Comentário: ${feedback}`);
    if (melhoria) feedbackParts.push(`Sugestão de melhoria: ${melhoria}`);
    const combinedFeedback = feedbackParts.length > 0 ? feedbackParts.join(" | ") : null;

    const { error } = await supabase.from("nps_respostas").insert({
      user_id: user.id,
      user_type: userType,
      nota,
      feedback: combinedFeedback,
    });

    if (error) {
      toast.error("Erro ao enviar: " + error.message);
    } else {
      toast.success("✅ Obrigado pelo feedback!");
      setVisible(false);
    }
    setSubmitting(false);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-4 md:p-5 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">💙 Sua opinião é muito importante!</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Em uma escala de 0 a 10, o quanto você recomendaria o Movê para um amigo?
          </p>
        </div>
        {!forceShow && (
          <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>Nada provável</span>
          <span>Muito provável</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setNota(i)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                nota === i
                  ? i <= 6
                    ? "bg-destructive text-destructive-foreground"
                    : i <= 8
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-500 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {nota !== null && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
          <div>
            <p className="text-xs font-medium text-foreground mb-1">Qual o principal motivo da sua nota?</p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={300}
              placeholder="Ex: facilidade de uso, qualidade dos mentores..."
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm min-h-[50px] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-1">{getFeedbackPrompt()}</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={500}
              placeholder="Sua resposta (opcional)..."
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm min-h-[50px] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-1">Tem alguma sugestão de melhoria?</p>
            <textarea
              value={melhoria}
              onChange={(e) => setMelhoria(e.target.value)}
              maxLength={500}
              placeholder="Funcionalidades, conteúdos, experiência..."
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm min-h-[50px] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </motion.div>
      )}

      <div className="flex gap-2">
        {!forceShow && (
          <button
            onClick={() => setVisible(false)}
            className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            Depois
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={nota === null || submitting}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </motion.div>
  );
};

export default NpsModal;
