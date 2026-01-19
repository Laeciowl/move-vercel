import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, Loader2 } from "lucide-react";
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

interface SessionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  mentorId: string;
  mentorName: string;
  userId: string;
  onReviewSubmitted?: () => void;
}

const SessionReviewModal = ({
  open,
  onOpenChange,
  sessionId,
  mentorId,
  mentorName,
  userId,
  onReviewSubmitted,
}: SessionReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação com estrelas");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("session_reviews").insert({
      session_id: sessionId,
      mentor_id: mentorId,
      user_id: userId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Você já avaliou esta sessão");
      } else {
        toast.error("Erro ao enviar avaliação: " + error.message);
      }
    } else {
      toast.success("Obrigado pela sua avaliação! 🌟");
      onOpenChange(false);
      setRating(0);
      setComment("");
      onReviewSubmitted?.();
    }

    setSubmitting(false);
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avalie sua mentoria</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com {mentorName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {displayRating > 0 && (
                <motion.p
                  key={displayRating}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-sm text-muted-foreground"
                >
                  {displayRating === 1 && "Poderia melhorar"}
                  {displayRating === 2 && "Regular"}
                  {displayRating === 3 && "Boa experiência"}
                  {displayRating === 4 && "Muito boa!"}
                  {displayRating === 5 && "Excelente! 🌟"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Deixe um comentário (opcional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi a experiência, o que você aprendeu..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full bg-gradient-hero text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar avaliação
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionReviewModal;
