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

const naoAconteceuOptions = [
  { value: "eu_nao_apareci", label: "Eu não apareci" },
  { value: "mentor_nao_apareceu", label: "O mentor não apareceu" },
  { value: "cancelamos_reagendar", label: "Cancelamos e vamos reagendar" },
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
  const [step, setStep] = useState<"pergunta" | "avaliar" | "nao_aconteceu">(initialAttendance ? "nao_aconteceu" : "pergunta");
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [reviewPublico, setReviewPublico] = useState(true);
  const [motivoNaoAconteceu, setMotivoNaoAconteceu] = useState<string | null>(null);
  const [detalhesMotivo, setDetalhesMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isReviewValid = rating !== null;
  const isNaoAconteceuValid = motivoNaoAconteceu !== null;

  const handleSubmitReview = async () => {
    if (!isReviewValid) return;
    setSubmitting(true);

    const { error } = await supabase.from("session_reviews").insert({
      session_id: sessionId,
      mentor_id: mentorId,
      user_id: userId,
      rating: rating!,
      comment: comment.trim() || null,
      review_publico: comment.trim() ? reviewPublico : false,
      mentoria_aconteceu: "sim",
      motivo_nao_aconteceu: null,
    } as any);

    if (error) {
      if (error.code === "23505") {
        toast.error("Você já avaliou esta sessão");
      } else {
        toast.error("Erro ao enviar avaliação: " + error.message);
      }
    } else {
      toast.success("Obrigado pela sua avaliação! 💜");
      onOpenChange(false);
      resetForm();
      onReviewSubmitted?.();
    }
    setSubmitting(false);
  };

  const handleSubmitNaoAconteceu = async () => {
    if (!isNaoAconteceuValid) return;
    setSubmitting(true);

    // Update session to cancelled with the reason
    const mentorNotes = motivoNaoAconteceu === "eu_nao_apareci"
      ? "Não realizada: mentorado não apareceu"
      : motivoNaoAconteceu === "mentor_nao_apareceu"
      ? "Não realizada: mentor não apareceu"
      : "Cancelada: vão reagendar";

    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        status: "cancelled",
        mentor_notes: mentorNotes + (detalhesMotivo.trim() ? ` — ${detalhesMotivo.trim()}` : ""),
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao registrar: " + error.message);
    } else {
      // Record attendance for no-show cases (triggers penalty system)
      if (motivoNaoAconteceu === "eu_nao_apareci" || motivoNaoAconteceu === "mentor_nao_apareceu") {
        const attendanceStatus = motivoNaoAconteceu === "eu_nao_apareci" 
          ? "no_show_mentorado" 
          : "no_show_mentor";
        try {
          await supabase.from("mentee_attendance").insert({
            session_id: sessionId,
            mentor_id: mentorId,
            mentee_user_id: userId,
            status: attendanceStatus,
            mentee_avisou: false,
            mentor_observations: mentorNotes + (detalhesMotivo.trim() ? ` — ${detalhesMotivo.trim()}` : ""),
            reported_by: userId,
          } as any);
        } catch (err) {
          console.error("Error recording attendance:", err);
        }
      }

      // Record attendance for cancelled/rescheduled
      if (motivoNaoAconteceu === "cancelamos_reagendar") {
        try {
          await supabase.from("mentee_attendance").insert({
            session_id: sessionId,
            mentor_id: mentorId,
            mentee_user_id: userId,
            status: "reagendada",
            mentee_avisou: true,
            mentor_observations: "Cancelada pelo mentorado para reagendar",
            reported_by: userId,
          } as any);
        } catch (err) {
          console.error("Error recording attendance:", err);
        }
      }

      // If mentor didn't show up, alert admins
      if (motivoNaoAconteceu === "mentor_nao_apareceu") {
        try {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              type: "admin_alert_mentor_noshow",
              data: {
                mentorName,
                mentorId,
                sessionId,
                userId,
                motivo: detalhesMotivo.trim() || "Não informado",
              },
            },
          });
        } catch (err) {
          console.error("Error notifying admin about no-show:", err);
        }
      }

      toast.success("Registrado com sucesso! Obrigado por nos informar.");
      onOpenChange(false);
      resetForm();
      onReviewSubmitted?.();
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setStep("pergunta");
    setRating(null);
    setComment("");
    setReviewPublico(true);
    setMotivoNaoAconteceu(null);
    setDetalhesMotivo("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {step === "pergunta" && `Mentoria com ${mentorName}`}
            {step === "avaliar" && `Como foi sua mentoria com ${mentorName}?`}
            {step === "nao_aconteceu" && "O que aconteceu?"}
          </DialogTitle>
          <DialogDescription>
            {step === "pergunta" && "Nos conte se essa mentoria aconteceu"}
            {step === "avaliar" && "Sua avaliação ajuda a melhorar o programa de mentorias"}
            {step === "nao_aconteceu" && "Nos ajude a entender o que houve"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Step 1: Aconteceu ou não? */}
          {step === "pergunta" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground text-center">
                Essa mentoria aconteceu?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("avaliar")}
                  className="h-20 flex-col gap-2 text-base hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all"
                >
                  <span className="text-2xl">✅</span>
                  Sim, aconteceu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("nao_aconteceu")}
                  className="h-20 flex-col gap-2 text-base hover:bg-destructive/5 hover:border-destructive/30 hover:text-destructive transition-all"
                >
                  <span className="text-2xl">❌</span>
                  Não aconteceu
                </Button>
              </div>
            </div>
          )}

          {/* Step 2a: Avaliar (mentoria aconteceu) */}
          {step === "avaliar" && (
            <>
              {/* Rating */}
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

              {/* Public feedback */}
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
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("pergunta")} className="flex-1">
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={!isReviewValid || submitting}
                  className="flex-1 bg-gradient-hero text-primary-foreground"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Enviar Avaliação</>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Step 2b: Não aconteceu */}
          {step === "nao_aconteceu" && (
            <>
              <div className="space-y-3 bg-muted/30 rounded-xl p-4">
                <p className="text-sm font-medium text-foreground">
                  O que houve? <span className="text-destructive">*</span>
                </p>
                <RadioGroup
                  value={motivoNaoAconteceu || ""}
                  onValueChange={(val) => setMotivoNaoAconteceu(val)}
                  className="space-y-2"
                >
                  {naoAconteceuOptions.map((option) => (
                    <div key={option.value} className="flex items-center gap-2.5">
                      <RadioGroupItem value={option.value} id={`motivo-${option.value}`} />
                      <Label
                        htmlFor={`motivo-${option.value}`}
                        className={`text-sm cursor-pointer ${
                          option.value === "mentor_nao_apareceu" ? "text-destructive font-medium" : ""
                        }`}
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Alert for mentor no-show */}
              {motivoNaoAconteceu === "mentor_nao_apareceu" && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">
                      Sentimos muito! Nossa equipe será notificada e entrará em contato com o mentor.
                    </p>
                  </div>
                  <Textarea
                    value={detalhesMotivo}
                    onChange={(e) => setDetalhesMotivo(e.target.value.slice(0, 300))}
                    placeholder="Descreva o que aconteceu (opcional)..."
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              )}

              {/* Optional details for other reasons */}
              {motivoNaoAconteceu && motivoNaoAconteceu !== "mentor_nao_apareceu" && (
                <div className="space-y-2">
                  <Textarea
                    value={detalhesMotivo}
                    onChange={(e) => setDetalhesMotivo(e.target.value.slice(0, 300))}
                    placeholder="Algum detalhe adicional? (opcional)"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("pergunta")} className="flex-1">
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmitNaoAconteceu}
                  disabled={!isNaoAconteceuValid || submitting}
                  className="flex-1"
                  variant="destructive"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Registrando...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Registrar</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionReviewModal;
