import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { isPast, parseISO, subHours } from "date-fns";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const DISMISS_KEY = "pending_reviews_dismissed_at";

const PendingReviewsBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkPending();
  }, [user]);

  const checkPending = async () => {
    if (!user) return;

    // Check if dismissed today
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      if (dismissedDate.toDateString() === now.toDateString()) return;
    }

    const twentyFourHoursAgo = subHours(new Date(), 24);

    // Fetch completed/past sessions
    const { data: sessions } = await supabase
      .from("mentor_sessions_with_names")
      .select("id, scheduled_at, status")
      .eq("user_id", user.id)
      .in("status", ["completed", "scheduled"]);

    if (!sessions || sessions.length === 0) return;

    // Filter past sessions (>24h ago)
    const pastSessions = sessions.filter((s) => {
      const scheduledAt = parseISO(s.scheduled_at!);
      return isPast(scheduledAt) && scheduledAt < twentyFourHoursAgo;
    });

    if (pastSessions.length === 0) return;

    // Check which have reviews
    const sessionIds = pastSessions.map((s) => s.id!);
    const { data: reviews } = await supabase
      .from("session_reviews")
      .select("session_id")
      .eq("user_id", user.id)
      .in("session_id", sessionIds);

    const reviewedIds = new Set((reviews || []).map((r) => r.session_id));
    const unreviewed = sessionIds.filter((id) => !reviewedIds.has(id));

    if (unreviewed.length > 0) {
      setPendingCount(unreviewed.length);
      setVisible(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="bg-[#FFF9F5] border border-primary/30 rounded-xl p-4 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Star className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Você tem {pendingCount} {pendingCount === 1 ? "mentoria" : "mentorias"} para avaliar!
              </p>
              <p className="text-xs text-muted-foreground">
                Sua avaliação ajuda a melhorar o programa!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground h-7"
            >
              Depois
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setVisible(false);
                // Scroll down to sessions section
                const el = document.querySelector("[data-mentee-sessions]");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground h-7 gap-1"
            >
              <Star className="w-3 h-3" /> Ver Mentorias
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PendingReviewsBanner;

export const usePendingReviewsCount = (userId: string | undefined) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      const twentyFourHoursAgo = subHours(new Date(), 24);
      const { data: sessions } = await supabase
        .from("mentor_sessions_with_names")
        .select("id, scheduled_at, status")
        .eq("user_id", userId)
        .in("status", ["completed", "scheduled"]);

      if (!sessions || sessions.length === 0) return;

      const pastSessions = sessions.filter((s) => {
        const scheduledAt = parseISO(s.scheduled_at!);
        return isPast(scheduledAt) && scheduledAt < twentyFourHoursAgo;
      });

      if (pastSessions.length === 0) return;

      const sessionIds = pastSessions.map((s) => s.id!);
      const { data: reviews } = await supabase
        .from("session_reviews")
        .select("session_id")
        .eq("user_id", userId)
        .in("session_id", sessionIds);

      const reviewedIds = new Set((reviews || []).map((r) => r.session_id));
      setCount(sessionIds.filter((id) => !reviewedIds.has(id)).length);
    };
    fetch();
  }, [userId]);

  return count;
};
