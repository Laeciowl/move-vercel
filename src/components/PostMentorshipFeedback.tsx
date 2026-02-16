import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";

interface PostMentorshipFeedbackProps {
  sessionId: string;
  mentorName: string;
  open: boolean;
  onClose: () => void;
}

const defaultActions = [
  "Atualizar currículo",
  "Otimizar LinkedIn",
  "Aplicar para vagas",
  "Fazer curso/capacitação",
];

const PostMentorshipFeedback = ({ sessionId, mentorName, open, onClose }: PostMentorshipFeedbackProps) => {
  const { user } = useAuth();
  const [aprendizado, setAprendizado] = useState("");
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [customAction, setCustomAction] = useState("");
  const [teveResultado, setTeveResultado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleAction = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const allActions = [...selectedActions];
    if (customAction.trim()) allActions.push(customAction.trim());

    const { error } = await supabase.from("mentoria_feedbacks").insert({
      mentoria_id: sessionId,
      mentorado_id: user.id,
      aprendizado_principal: aprendizado || null,
      acoes_planejadas: allActions.length > 0 ? allActions : null,
      teve_resultado: teveResultado,
    });

    if (error) {
      toast.error("Erro ao enviar feedback: " + error.message);
    } else {
      toast.success("✅ Feedback enviado! Obrigado!");
      onClose();
    }
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        >
          <h2 className="text-lg font-bold text-foreground">
            Como foi sua mentoria com {mentorName}?
          </h2>

          {/* Learning */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Principal aprendizado: (opcional)</label>
            <textarea
              value={aprendizado}
              onChange={(e) => setAprendizado(e.target.value)}
              maxLength={200}
              placeholder="O que você mais aprendeu..."
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground text-right">{aprendizado.length}/200</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Vai aplicar algo? (opcional)</label>
            <div className="space-y-1.5">
              {defaultActions.map((action) => (
                <button
                  key={action}
                  onClick={() => toggleAction(action)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                    selectedActions.includes(action)
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <CheckCircle className={`w-4 h-4 shrink-0 ${selectedActions.includes(action) ? "text-primary" : "text-muted-foreground/30"}`} />
                  {action}
                </button>
              ))}
              <input
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                placeholder="Outro: descreva aqui..."
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Result */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">🎉 Conseguiu algo importante?</label>
            <p className="text-xs text-muted-foreground">(ex: emprego, entrevista, promoção)</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTeveResultado(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  !teveResultado ? "bg-muted text-foreground" : "bg-muted/30 text-muted-foreground"
                }`}
              >
                Não (ainda)
              </button>
              <button
                onClick={() => setTeveResultado(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  teveResultado ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted/30 text-muted-foreground"
                }`}
              >
                Sim! 🎉
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Pular
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enviar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PostMentorshipFeedback;
