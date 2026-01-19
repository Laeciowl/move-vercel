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
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Por favor, escreva um comentário sobre a mentoria");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("session_reviews").insert({
      session_id: sessionId,
      mentor_id: mentorId,
      user_id: userId,
      rating: 5, // Default value since column is required
      comment: comment.trim(),
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Você já deixou um feedback para esta sessão");
      } else {
        toast.error("Erro ao enviar feedback: " + error.message);
      }
    } else {
      toast.success("Obrigado pelo seu feedback! 💜");
      onOpenChange(false);
      setComment("");
      onReviewSubmitted?.();
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Deixe seu feedback
          </DialogTitle>
          <DialogDescription>
            Conte como foi sua experiência com {mentorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Seu feedback
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte como foi a experiência, o que você aprendeu, o que mais gostou..."
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!comment.trim() || submitting}
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
                Enviar feedback
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionReviewModal;
