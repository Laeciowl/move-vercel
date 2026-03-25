import { useState } from "react";
import { Send, Loader2, MessageSquare, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SessionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  mentorId: string;
  mentorName: string;
  userId: string;
  onReviewSubmitted?: () => void;
  initialAttendance?: string;
}

const ratingEmojis = [
  { emoji: "😞", label: "Ruim", value: 1 },
  { emoji: "😐", label: "Regular", value: 2 },
  { emoji: "🙂", label: "Bom", value: 3 },
  { emoji: "😊", label: "Muito bom", value: 4 },
  { emoji: "😍", label: "Excelente", value: 5 },
];

const attendanceOptions = [
  { value: "sim", label: "Sim, aconteceu normalmente" },
  { value: "eu_nao_apareci", label: "Não, EU não apareci" },
  { value: "mentor_nao_apareceu", label: "Não, o MENTOR não apareceu" },
  { value: "cancelamos_reagendar", label: "Não, cancelamos e vamos reagendar" },
];

const SessionReviewModal = ({
  open,
  onOpenChange,
  sessionId,
  mentorId,
  mentorName,
  userId,
  onReviewSubmitted,
  initialAttendance,
}: SessionReviewModalProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [reviewPublico, setReviewPublico] = useState(true);
  const [mentoriaAconteceu, setMentoriaAconteceu] = useState<string | null>(initialAttendance || null);
  const [motivoNaoAconteceu, setMotivoNaoAconteceu] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showMotivoField = mentoriaAconteceu === "mentor_nao_apareceu";
  const mentoriaRealizada = mentoriaAconteceu === "sim";
  
  // Rating is required only if mentoria happened
  const isValid = mentoriaAconteceu !== null && (mentoriaRealizada ? rating !== null : true);

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setSubmitting(true);

    // Use rating 1 for sessions that didn't happen (DB requires 1-5, won't count in public averages)
    const finalRating = mentoriaRealizada ? rating! : 1;

    const { error } = await supabase.from("session_reviews").insert({
      session_id: sessionId,
      mentor_id: mentorId,
      user_id: userId,
      rating: finalRating,
      comment: comment.trim() || null,
      review_publico: comment.trim() ? reviewPublico : false,
      mentoria_aconteceu: mentoriaAconteceu,
      motivo_nao_aconteceu: showMotivoField && motivoNaoAconteceu.trim() ? motivoNaoAconteceu.trim() : null,
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast.error("Você já avaliou esta sessão");
      } else {
        toast.error("Erro ao enviar avaliação: " + error.message);
      }
    } else {
      // If mentor didn't show up, alert admins
      if (mentoriaAconteceu === "mentor_nao_apareceu") {
        try {
          // Create admin notification via edge function
          await supabase.functions.invoke("send-notification-email", {
            body: {
              type: "admin_alert_mentor_noshow",
              data: {
                mentorName,
                mentorId,
                sessionId,
                userId,
                motivo: motivoNaoAconteceu.trim() || "Não informado",
              },
            },
          });
        } catch (err) {
          console.error("Error notifying admin about no-show:", err);
        }
      }

      toast.success("Obrigado pela sua avaliação! 💜");
      onOpenChange(false);
      resetForm();
      onReviewSubmitted?.();
    }

    setSubmitting(false);
  };

  const resetForm = () => {
    setRating(null);
    setComment("");
    setReviewPublico(true);
    setMentoriaAconteceu(null);
    setMotivoNaoAconteceu("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Como foi sua mentoria com {mentorName}?
          </DialogTitle>
          <DialogDescription>
            Sua avaliação ajuda a melhorar o programa de mentorias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* 1. Mentoria Aconteceu? (Obrigatório) */}
          <div className="space-y-3 bg-muted/30 rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                📋 A mentoria aconteceu? <span className="text-destructive">*</span>
              </p>
            </div>
            <RadioGroup
              value={mentoriaAconteceu || ""}
              onValueChange={(val) => setMentoriaAconteceu(val)}
              className="space-y-2"
            >
              {attendanceOptions.map((option) => (
                <div key={option.value} className="flex items-center gap-2.5">
                  <RadioGroupItem value={option.value} id={`attendance-${option.value}`} />
                  <Label
                    htmlFor={`attendance-${option.value}`}
                    className={`text-sm cursor-pointer ${
                      option.value === "mentor_nao_apareceu" ? "text-destructive font-medium" : ""
                    }`}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Motivo field when mentor didn't show */}
            {showMotivoField && (
              <div className="mt-3 bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">
                    Sentimos muito! Nossa equipe será notificada e entrará em contato com o mentor.
                  </p>
                </div>
                <Textarea
                  value={motivoNaoAconteceu}
                  onChange={(e) => setMotivoNaoAconteceu(e.target.value.slice(0, 300))}
                  placeholder="Descreva o que aconteceu (opcional)..."
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            )}
          </div>

          {/* 2. Rating (Obrigatório se mentoria aconteceu) */}
          {mentoriaRealizada && (
            <div className="space-y-3 bg-muted/30 rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  ⭐ Como foi a mentoria? <span className="text-destructive">*</span>{" "}
                  <span className="text-muted-foreground font-normal">(privado)</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ⓘ Esta nota é privada e usada apenas para garantir a qualidade das mentorias.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {ratingEmojis.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setRating(item.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      rating === item.value
                        ? "bg-primary/10 ring-2 ring-primary/50 scale-110"
                        : "hover:bg-muted/50 hover:scale-105"
                    }`}
                    title={item.label}
                  >
                    <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Feedback Público (Opcional) - only if mentoria happened */}
          {mentoriaRealizada && (
            <>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  💬 Deixe um feedback público <span className="text-muted-foreground font-normal">(opcional)</span>
                </p>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="O que foi mais útil? Como a mentoria te ajudou?"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
              </div>

              {/* Public checkbox */}
              {comment.trim() && (
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="review-publico"
                      checked={reviewPublico}
                      onCheckedChange={(checked) => setReviewPublico(checked === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="review-publico" className="cursor-pointer">
                      <p className="text-sm font-medium text-foreground">Tornar feedback público</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Seu nome e foto aparecerão no perfil do mentor junto com seu comentário.
                        Isso ajuda outros mentorados a conhecerem a experiência!
                      </p>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="flex-1 bg-gradient-hero text-primary-foreground"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionReviewModal;
