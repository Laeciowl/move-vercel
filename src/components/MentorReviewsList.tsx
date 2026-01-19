import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, MessageSquare, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Review {
  id: string;
  comment: string | null;
  created_at: string;
}

interface MentorReviewsListProps {
  reviews: Review[];
  maxVisible?: number;
}

const MentorReviewsList = ({ reviews, maxVisible = 3 }: MentorReviewsListProps) => {
  const [expanded, setExpanded] = useState(false);

  // Filter only reviews that have comments
  const reviewsWithComments = reviews.filter(r => r.comment?.trim());

  if (reviewsWithComments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
        Nenhum feedback ainda
      </div>
    );
  }

  const visibleReviews = expanded ? reviewsWithComments : reviewsWithComments.slice(0, maxVisible);
  const hasMore = reviewsWithComments.length > maxVisible;

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
            className="p-4 bg-accent/50 rounded-xl space-y-2"
          >
            <div className="flex items-start gap-2">
              <Quote className="w-4 h-4 text-primary/50 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80 italic">
                {review.comment}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {format(new Date(review.created_at), "dd MMM yyyy", { locale: ptBR })}
            </p>
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
              Ver mais {reviewsWithComments.length - maxVisible} feedbacks
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default MentorReviewsList;
