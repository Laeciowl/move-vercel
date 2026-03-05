import { useState } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";
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

interface SessionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  mentorId: string;
  mentorName: string;
  userId: string;
  onReviewSubmitted?: () => void;
}

const ratingEmojis = [
  { emoji: "😞", label: "Ruim", value: 1 },
  { emoji: "😐", label: "Regular", value: 2 },
  { emoji: "🙂", label: "Bom", value: 3 },
  { emoji: "😊", label: "Muito bom", value: 4 },
  { emoji: "😍", label: "Excelente", value: 5 },
];

const SessionReviewModal = ({
  open,
  onOpenChange,
  sessionId,
  mentorId,
  mentorName,
  userId,
  onReviewSubmitted,
}: SessionReviewModalProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [reviewPublico, setReviewPublico] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Por favor, avalie a mentoria");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("session_reviews").insert({
      session_id: sessionId,
      mentor_id: mentorId,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
      review_publico: comment.trim() ? reviewPublico : false,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Você já avaliou esta sessão");
      } else {
        toast.error("Erro ao enviar avaliação: " + error.message);
      }
    } else {
      toast.success("Obrigado pela sua avaliação! 💜");
      onOpenChange(false);
      setRating(null);
      setComment("");
      setReviewPublico(true);
      onReviewSubmitted?.();
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Como foi sua mentoria com {mentorName}?
          </DialogTitle>
          <DialogDescription>
            Sua avaliação ajuda a melhorar o programa de mentorias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Section (Private) */}
          <div className="space-y-3 bg-muted/30 rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-foreground">⭐ Como foi a mentoria? <span className="text-muted-foreground font-normal">(privado)</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                ⓘ Esta nota é privada e usada apenas para garantir a qualidade das mentorias.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
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
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment Section (Public if opted) */}
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

          {/* Submit */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!rating || submitting}
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
