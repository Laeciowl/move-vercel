import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, ChevronRight, Loader2, CheckCircle, XCircle, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import SessionReviewModal from "./SessionReviewModal";

interface Session {
  id: string;
  scheduled_at: string;
  status: string;
  confirmed_by_mentor: boolean | null;
  mentor_name: string | null;
  mentor_id: string | null;
  duration: number | null;
}

interface ReviewedSession {
  session_id: string;
  comment: string | null;
}

const MenteeSessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reviewedSessions, setReviewedSessions] = useState<Map<string, ReviewedSession>>(new Map());
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; session: Session | null }>({ open: false, session: null });

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;
    const [sessionsRes, reviewsRes] = await Promise.all([
      supabase
        .from("mentor_sessions_with_names")
        .select("id, scheduled_at, status, confirmed_by_mentor, mentor_name, mentor_id, duration")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: false })
        .limit(20),
      supabase
        .from("session_reviews")
        .select("session_id, comment")
        .eq("user_id", user.id),
    ]);

    if (!sessionsRes.error && sessionsRes.data) {
      setSessions(sessionsRes.data as Session[]);
    }
    if (!reviewsRes.error && reviewsRes.data) {
      const map = new Map<string, ReviewedSession>();
      reviewsRes.data.forEach((r) => map.set(r.session_id, { session_id: r.session_id, comment: r.comment }));
      setReviewedSessions(map);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const upcoming = sessions.filter(
    (s) => s.status === "scheduled" && !isPast(parseISO(s.scheduled_at))
  );
  const completedOrPast = sessions.filter(
    (s) => s.status === "completed" || (s.status === "scheduled" && isPast(parseISO(s.scheduled_at)))
  );
  const cancelled = sessions.filter((s) => s.status === "cancelled");

  const getStatusBadge = (session: Session) => {
    if (session.status === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
          <CheckCircle className="w-3 h-3" /> Realizada
        </span>
      );
    }
    if (session.status === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
          <XCircle className="w-3 h-3" /> Cancelada
        </span>
      );
    }
    if (session.confirmed_by_mentor) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          <CheckCircle className="w-3 h-3" /> Confirmada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
        <Clock className="w-3 h-3" /> Aguardando
      </span>
    );
  };

  const isReviewed = (sessionId: string) => reviewedSessions.has(sessionId);
  const canReview = (session: Session) =>
    (session.status === "completed" || (session.status === "scheduled" && isPast(parseISO(session.scheduled_at)))) &&
    !isReviewed(session.id);

  const SessionItem = ({ session }: { session: Session }) => {
    const reviewed = isReviewed(session.id);
    const needsReview = canReview(session);
    const reviewData = reviewedSessions.get(session.id);

    return (
      <div
        className={`rounded-xl transition-colors ${
          needsReview
            ? "bg-[#FFF9F5] border-2 border-primary/60 cursor-pointer hover:shadow-md"
            : "hover:bg-muted/30 border border-transparent"
        } p-4`}
        onClick={needsReview ? () => setReviewModal({ open: true, session }) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              needsReview ? "bg-primary/15" : "bg-primary/10"
            }`}>
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {session.mentor_name || "Mentor"}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(session.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(session)}
          </div>
        </div>

        {/* Review status */}
        {needsReview && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-medium text-primary flex items-center gap-1">
              <Star className="w-3.5 h-3.5" /> Pendente de avaliação
            </span>
            <Button size="sm" className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
              <Star className="w-3 h-3" /> Avaliar Mentoria
            </Button>
          </div>
        )}

        {reviewed && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle className="w-3 h-3" /> Avaliada
            </span>
            {reviewData?.comment && (
              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">"{reviewData.comment}"</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (sessions.length === 0) {
    return (
      <motion.div
        variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
        className="bg-card rounded-2xl border border-border/40 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Minhas Mentorias</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Você ainda não agendou nenhuma mentoria. Encontre um mentor e comece agora!
        </p>
        <Button
          onClick={() => navigate("/mentores")}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2"
        >
          <User className="w-4 h-4" />
          Encontrar mentores
        </Button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
        className="bg-card rounded-2xl border border-border/40 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Minhas Mentorias</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/mentores")}
            className="text-primary hover:bg-primary/10 gap-1 text-xs"
          >
            Ver mentores <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {upcoming.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Próximas
            </p>
            <div className="space-y-1">
              {upcoming.map((s) => (
                <SessionItem key={s.id} session={s} />
              ))}
            </div>
          </div>
        )}

        {completedOrPast.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Realizadas
            </p>
            <div className="space-y-2">
              {completedOrPast.slice(0, 5).map((s) => (
                <SessionItem key={s.id} session={s} />
              ))}
            </div>
          </div>
        )}

        {cancelled.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Canceladas
            </p>
            <div className="space-y-1">
              {cancelled.slice(0, 2).map((s) => (
                <SessionItem key={s.id} session={s} />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Review Modal */}
      {reviewModal.session && (
        <SessionReviewModal
          open={reviewModal.open}
          onOpenChange={(open) => setReviewModal({ open, session: open ? reviewModal.session : null })}
          sessionId={reviewModal.session.id}
          mentorId={reviewModal.session.mentor_id || ""}
          mentorName={reviewModal.session.mentor_name || "Mentor"}
          userId={user?.id || ""}
          onReviewSubmitted={fetchSessions}
        />
      )}
    </>
  );
};

export default MenteeSessions;
