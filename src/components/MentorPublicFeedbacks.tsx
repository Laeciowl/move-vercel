import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, User, Loader2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Feedback {
  review_id: string;
  comment: string;
  created_at: string;
  mentee_name: string;
  mentee_photo_url: string | null;
}

interface MentorPublicFeedbacksProps {
  mentorId: string;
  totalCount?: number;
}

const MentorPublicFeedbacks = ({ mentorId, totalCount }: MentorPublicFeedbacksProps) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 5;

  useEffect(() => {
    fetchFeedbacks(0);
  }, [mentorId]);

  const fetchFeedbacks = async (newOffset: number) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_mentor_public_feedbacks", {
      p_mentor_id: mentorId,
      p_limit: limit + 1,
      p_offset: newOffset,
    });

    if (!error && data) {
      const items = (data as Feedback[]);
      setHasMore(items.length > limit);
      const visibleItems = items.slice(0, limit);
      
      if (newOffset === 0) {
        setFeedbacks(visibleItems);
      } else {
        setFeedbacks(prev => [...prev, ...visibleItems]);
      }
      setOffset(newOffset + limit);
    }
    setLoading(false);
  };

  const displayCount = totalCount ?? feedbacks.length;

  if (!loading && feedbacks.length === 0) {
    return (
      <div className="bg-muted/20 rounded-2xl p-8 text-center">
        <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Este mentor ainda não recebeu feedbacks públicos
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Seja o primeiro a agendar uma mentoria!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        Feedbacks de Mentorados {displayCount > 0 && `(${displayCount})`}
      </h3>

      <div className="space-y-3">
        {feedbacks.map((feedback, index) => (
          <motion.div
            key={feedback.review_id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border/40 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center shrink-0">
                {feedback.mentee_photo_url ? (
                  <img src={feedback.mentee_photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {feedback.mentee_name}
                  </p>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(feedback.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  "{feedback.comment}"
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      {hasMore && !loading && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchFeedbacks(offset)}
          className="w-full text-muted-foreground"
        >
          <ChevronDown className="w-4 h-4 mr-1" />
          Carregar mais feedbacks
        </Button>
      )}
    </div>
  );
};

export default MentorPublicFeedbacks;
