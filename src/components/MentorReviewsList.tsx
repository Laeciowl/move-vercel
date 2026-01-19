import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface MentorReviewsListProps {
  reviews: Review[];
  maxVisible?: number;
}

const MentorReviewsList = ({ reviews, maxVisible = 3 }: MentorReviewsListProps) => {
  const [expanded, setExpanded] = useState(false);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
        Nenhuma avaliação ainda
      </div>
    );
  }

  const visibleReviews = expanded ? reviews : reviews.slice(0, maxVisible);
  const hasMore = reviews.length > maxVisible;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {visibleReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 bg-accent/50 rounded-xl space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${
                      s <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-foreground/80 line-clamp-3">
                "{review.comment}"
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Ver mais {reviews.length - maxVisible} avaliações
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default MentorReviewsList;
