import { useState, useEffect } from "react";
import { MessageSquare, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  mentorId: string;
  totalReviews: number;
  onViewAll: () => void;
}

const MentorCardFeedbackPreview = ({ mentorId, totalReviews, onViewAll }: Props) => {
  const [latestComment, setLatestComment] = useState<string | null>(null);

  useEffect(() => {
    if (totalReviews === 0) return;
    const fetchLatest = async () => {
      const { data } = await supabase.rpc("get_mentor_public_feedbacks", {
        p_mentor_id: mentorId,
        p_limit: 1,
        p_offset: 0,
      });
      if (data && data.length > 0 && data[0].comment) {
        setLatestComment(data[0].comment);
      }
    };
    fetchLatest();
  }, [mentorId, totalReviews]);

  if (totalReviews === 0) return null;

  return (
    <div className="w-full mt-2.5">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewAll();
        }}
        className="w-full text-left bg-primary/5 border border-primary/15 rounded-xl px-3 py-2.5 hover:bg-primary/10 transition-colors group"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-primary">
            {totalReviews} {totalReviews === 1 ? "feedback" : "feedbacks"}
          </span>
          <div className="flex ml-auto">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-2.5 h-2.5 fill-primary/60 text-primary/60"
              />
            ))}
          </div>
        </div>
        {latestComment && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed italic">
            "{latestComment}"
          </p>
        )}
        <span className="text-[10px] text-primary font-medium group-hover:underline mt-1 inline-block">
          Ver todos →
        </span>
      </button>
    </div>
  );
};

export default MentorCardFeedbackPreview;
