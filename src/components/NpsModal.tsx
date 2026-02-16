import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NpsModalProps {
  userType: "mentor" | "mentorado";
}

const NpsModal = ({ userType }: NpsModalProps) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [nota, setNota] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkShouldShow();
  }, [user]);

  const checkShouldShow = async () => {
    if (!user) return;

    // Check if already responded in the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: recentNps } = await supabase
      .from("nps_respostas")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", ninetyDaysAgo.toISOString())
      .limit(1);

    if (recentNps && recentNps.length > 0) return;

    // Check triggers
    if (userType === "mentorado") {
      const { data: completedSessions } = await supabase
        .from("mentor_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed");

      const completedCount = completedSessions?.length || 0;

      // After 2nd completed session
      if (completedCount >= 2) {
        setVisible(true);
        return;
      }

      // After completing 1st trail
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
      // Mentor: after 5th session
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

    const { error } = await supabase.from("nps_respostas").insert({
      user_id: user.id,
      user_type: userType,
      nota,
      feedback: feedback || null,
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5"
        >
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-bold text-foreground">💙 Sua opinião é muito importante!</h2>
            <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
          </div>

          <p className="text-sm text-muted-foreground">
            Em uma escala de 0 a 10, o quanto você recomendaria o Movê para um amigo?
          </p>

          {/* Score selector */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Nada provável</span>
              <span>Muito provável</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setNota(i)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    nota === i
                      ? i <= 6
                        ? "bg-red-500 text-white"
                        : i <= 8
                        ? "bg-amber-500 text-white"
                        : "bg-green-500 text-white"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {nota !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <p className="text-sm font-medium text-foreground">{getFeedbackPrompt()}</p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                maxLength={500}
                placeholder="Sua resposta (opcional)..."
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </motion.div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setVisible(false)}
              className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Responder depois
            </button>
            <button
              onClick={handleSubmit}
              disabled={nota === null || submitting}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar feedback"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NpsModal;
