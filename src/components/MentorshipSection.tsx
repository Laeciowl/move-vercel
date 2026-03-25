import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Loader2, CheckCircle, XCircle, Users, Timer, Star, Heart, ArrowRight, AlertTriangle, Video, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { useMentorCheck } from "@/hooks/useMentorCheck";
import { usePendingMentorCheck } from "@/hooks/usePendingMentorCheck";
import SessionManagement from "./SessionManagement";
import SessionReviewModal from "./SessionReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Sessions created before this date follow old auto-complete logic
// Sessions created on or after this date require manual confirmation
const MANUAL_COMPLETION_CUTOFF = "2026-02-06T00:00:00.000Z";

interface MentorSession {
  id: string;
  mentor_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  confirmed_by_mentor?: boolean;
  duration?: number;
  completed_at?: string;
  meeting_link?: string | null;
  reconfirmation_sent?: boolean | null;
  reconfirmation_confirmed?: boolean | null;
  hasReview?: boolean;
  reviewComment?: string | null;
  mentor?: {
    name: string;
    area: string;
    photo_url: string | null;
    email?: string;
  };
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: { 
    label: "Agendada", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <Calendar className="w-3 h-3" />
  },
  completed: { 
    label: "Realizada", 
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: <CheckCircle className="w-3 h-3" />
  },
  cancelled: { 
    label: "Cancelada", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: <XCircle className="w-3 h-3" />
  },
};

const MentorshipSection = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isVolunteer } = useVolunteerCheck();
  const { isMentor } = useMentorCheck();
  const { isPendingMentor } = usePendingMentorCheck();
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sessionToReview, setSessionToReview] = useState<MentorSession | null>(null);

  const showBecomeMentorCta = !isVolunteer && !isMentor && !isPendingMentor;

  const fetchSessions = async () => {
    if (!user) return;

    const { data: sessionsData, error: sessionsError } = await supabase
      .from("mentor_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: false });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      setLoading(false);
      return;
    }

    if (!sessionsData || sessionsData.length === 0) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const mentorIds = [...new Set(sessionsData.map(s => s.mentor_id))];
    const sessionIds = sessionsData.map(s => s.id);
    
    const [mentorsResult, reviewsResult] = await Promise.all([
      supabase
        .from("mentors")
        .select("id, name, area, photo_url, email")
        .in("id", mentorIds),
      supabase
        .from("session_reviews")
        .select("session_id, comment")
        .in("session_id", sessionIds)
    ]);

    const mentorsMap = new Map(
      (mentorsResult.data || []).map(m => [m.id, m])
    );

    const reviewsMap = new Map(
      (reviewsResult.data || []).map(r => [r.session_id, r])
    );

    const data = sessionsData.map(session => ({
      ...session,
      mentor: mentorsMap.get(session.mentor_id) || null,
      hasReview: reviewsMap.has(session.id),
      reviewComment: reviewsMap.get(session.id)?.comment || null,
    }));
    setSessions(data as MentorSession[]);
    setLoading(false);
  };

  const openReviewModal = (session: MentorSession) => {
    setSessionToReview(session);
    setReviewModalOpen(true);
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  // Check if session time has passed
  const isSessionPast = (scheduledAt: string, duration: number = 30) => {
    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime <= new Date();
  };

  // Check if session requires manual confirmation (created after cutoff)
  const requiresManualConfirmation = (createdAt: string) => {
    return new Date(createdAt) >= new Date(MANUAL_COMPLETION_CUTOFF);
  };

  // Determine if session is effectively completed
  const isEffectivelyCompleted = (session: MentorSession) => {
    if (session.status === "completed") return true;
    if (session.status !== "scheduled") return false;
    
    const past = isSessionPast(session.scheduled_at, session.duration || 30);
    if (!past) return false;
    
    return !requiresManualConfirmation(session.created_at);
  };

  // Sessions awaiting completion confirmation (past, scheduled, new flow)
  const pendingCompletionSessions = sessions.filter(s => {
    if (s.status !== "scheduled") return false;
    if (!isSessionPast(s.scheduled_at, s.duration || 30)) return false;
    return requiresManualConfirmation(s.created_at);
  });

  // Check for unreviewed completed sessions
  const unreviewedCompletedSessions = sessions.filter(s => {
    const completed = s.status === "completed" || isEffectivelyCompleted(s);
    return completed && !s.hasReview && s.status !== "cancelled";
  });

  const hasPendingConfirmations = pendingCompletionSessions.length > 0;
  const hasUnreviewedSessions = unreviewedCompletedSessions.length > 0;
  const isBookingBlocked = hasPendingConfirmations;

  // Confirm session as completed
  const handleConfirmCompletion = async (session: MentorSession) => {
    setConfirmingId(session.id);
    
    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (error) {
      toast.error("Erro ao confirmar sessão: " + error.message);
      setConfirmingId(null);
      return;
    }

    // Send review notification email to mentee
    try {
      await supabase.functions.invoke("send-notification-email", {
        body: {
          to: user?.email,
          name: profile?.name || "Mentorado",
          type: "session_review_request",
          data: {
            mentorName: session.mentor?.name || "Mentor",
          },
        },
      });
    } catch (err) {
      console.error("Error sending review notification:", err);
    }

    // Sync to Google Calendar for both parties
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (authSession) {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync?action=create-event`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authSession.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ session_id: session.id }),
          }
        );
      }
    } catch (err) {
      console.error("Google Calendar sync error:", err);
    }

    toast.success("Sessão confirmada como realizada! 🎉");
    setConfirmingId(null);

    // Auto-complete trail mentoria steps
    try {
      if (user) {
        const { data: mentorTags } = await supabase
          .from("mentor_tags")
          .select("tags(slug)")
          .eq("mentor_id", session.mentor_id);

        const tagSlugs = (mentorTags || []).map((mt: any) => mt.tags?.slug).filter(Boolean);

        const { data: activeTrails } = await supabase
          .from("progresso_trilha")
          .select("trilha_id")
          .eq("mentorado_id", user.id)
          .is("concluido_em", null);

        if (activeTrails && activeTrails.length > 0) {
          const trilhaIds = activeTrails.map(t => t.trilha_id);

          const { data: mentoriaSteps } = await supabase
            .from("passos_trilha")
            .select("id, trilha_id, tags_mentor_requeridas, ordem")
            .in("trilha_id", trilhaIds)
            .eq("tipo", "mentoria");

          for (const step of mentoriaSteps || []) {
            const { data: existing } = await supabase
              .from("progresso_passo")
              .select("id")
              .eq("mentorado_id", user.id)
              .eq("passo_id", step.id)
              .eq("completado", true)
              .maybeSingle();

            if (existing) continue;

            const requiredTags = step.tags_mentor_requeridas || [];
            const hasMatch = requiredTags.length === 0 || requiredTags.some((tag: string) =>
              tagSlugs.some((s: string) => s.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(s.toLowerCase()))
            );

            if (hasMatch) {
              await supabase.from("progresso_passo").upsert({
                mentorado_id: user.id,
                passo_id: step.id,
                completado: true,
                completado_em: new Date().toISOString(),
                completado_automaticamente: true,
              }, { onConflict: "mentorado_id,passo_id" });

              const { data: allSteps } = await supabase
                .from("passos_trilha")
                .select("id")
                .eq("trilha_id", step.trilha_id);

              const { data: completedSteps } = await supabase
                .from("progresso_passo")
                .select("passo_id")
                .eq("mentorado_id", user.id)
                .eq("completado", true)
                .in("passo_id", (allSteps || []).map(s => s.id));

              const total = allSteps?.length || 1;
              const done = completedSteps?.length || 0;
              const pct = Math.round((done / total) * 100);

              const updateData: any = { progresso_percentual: pct };
              if (done >= total) updateData.concluido_em = new Date().toISOString();

              await supabase.from("progresso_trilha")
                .update(updateData)
                .eq("mentorado_id", user.id)
                .eq("trilha_id", step.trilha_id);

              const { data: trailInfo } = await supabase
                .from("trilhas")
                .select("titulo")
                .eq("id", step.trilha_id)
                .maybeSingle();

              toast.success(`✅ Passo da trilha '${trailInfo?.titulo || ""}' completado automaticamente!`);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error auto-completing trail steps:", err);
    }

    await fetchSessions();
    
    // Open review modal
    openReviewModal(session);
  };

  // Handle reconfirmation
  const handleReconfirmPresence = async (sessionId: string) => {
    setConfirmingId(sessionId);
    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        reconfirmation_confirmed: true,
        reconfirmation_confirmed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao confirmar presença");
    } else {
      toast.success("Presença confirmada! ✅");
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: { type: "mentee_reconfirmed", data: { sessionId } },
        });
      } catch (e) {
        console.error("Error notifying mentor:", e);
      }
      fetchSessions();
    }
    setConfirmingId(null);
  };

  // Handle reconfirmation cancel
  const handleCancelFromReconfirmation = async (sessionId: string) => {
    setConfirmingId(sessionId);
    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        status: "cancelled",
        mentor_notes: "Cancelada pelo mentorado na reconfirmação",
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao cancelar sessão");
    } else {
      toast.success("Sessão cancelada");
      fetchSessions();
    }
    setConfirmingId(null);
  };

    // Upcoming: scheduled and not yet started
  const upcomingSessions = sessions.filter(
    (s) => s.status === "scheduled" && !isSessionPast(s.scheduled_at, s.duration || 30)
  );

  // Past sessions (completed or cancelled or auto-completed old sessions)
  const pastSessions = sessions.filter(s => {
    if (s.status === "cancelled" || s.status === "completed") return true;
    if (s.status === "scheduled" && isSessionPast(s.scheduled_at, s.duration || 30)) {
      return !requiresManualConfirmation(s.created_at);
    }
    return false;
  });

  const allFinished = [...pastSessions].sort(
    (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Session Card for Past Sessions
  const PastSessionCard = ({ session }: { session: MentorSession }) => {
    const isCompleted = isEffectivelyCompleted(session);
    const isCancelled = session.status === "cancelled";
    const canReview = isCompleted && !isCancelled && !session.hasReview;
    const isReviewed = session.hasReview;

    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl p-4 transition-all ${
          canReview
            ? "bg-[#FFF9F5] border-2 border-primary/60 shadow-sm"
            : "bg-card border border-border/50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {session.mentor?.photo_url ? (
              <img src={session.mentor.photo_url} alt={session.mentor?.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {session.mentor?.name || "Mentor"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatShortDate(session.scheduled_at)}
              {session.duration && ` • ${session.duration} min`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {canReview && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20 uppercase animate-pulse">
                Não avaliada
              </span>
            )}
            {isReviewed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                <CheckCircle className="w-3 h-3" /> Avaliada
              </span>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                <XCircle className="w-3 h-3" /> Cancelada
              </span>
            )}
            {!canReview && !isReviewed && !isCancelled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3" /> Realizada
              </span>
            )}
          </div>
        </div>

        {/* Review preview */}
        {isReviewed && session.reviewComment && (
          <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1 pl-[52px]">
            "{session.reviewComment}"
          </p>
        )}

        {/* CTA for unreviewed */}
        {canReview && (
          <div className="mt-3 flex items-center justify-between pl-[52px]">
            <span className="text-xs font-medium text-primary flex items-center gap-1">
              <Star className="w-3.5 h-3.5" /> Pendente de avaliação
            </span>
            <Button
              size="sm"
              onClick={() => openReviewModal(session)}
              className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
            >
              <Star className="w-3 h-3" /> Avaliar Mentoria
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.section
      id="mentorship-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Suas Mentorias</h3>
        </div>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={() => navigate("/mentores")}
            disabled={isBookingBlocked}
            className="bg-gradient-hero text-primary-foreground shadow-button hover:shadow-lg transition-all duration-300 gap-2"
          >
            <Users className="w-4 h-4" />
            {isMentor ? "Ir para área de mentoria" : "Encontrar mentor"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>

      {/* Pending confirmation warning */}
      {hasPendingConfirmations && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground text-sm">Confirme suas mentorias realizadas</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Você precisa confirmar se suas mentorias passadas foram realizadas antes de agendar uma nova sessão.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Unreviewed sessions warning */}
      {!hasPendingConfirmations && hasUnreviewedSessions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFF9F5] border border-primary/30 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-foreground text-sm">
                ⭐ Você tem {unreviewedCompletedSessions.length} {unreviewedCompletedSessions.length === 1 ? "mentoria" : "mentorias"} para avaliar!
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Sua avaliação é essencial para garantir a qualidade das mentorias.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Pending Completion Confirmation */}
          {pendingCompletionSessions.length > 0 && (
            <div className="bg-card rounded-2xl shadow-card p-4 md:p-5 space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Confirme a realização ({pendingCompletionSessions.length})
              </h4>
              <div className="space-y-3">
                {pendingCompletionSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/30 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {session.mentor?.photo_url ? (
                          <img src={session.mentor.photo_url} alt={session.mentor.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {session.mentor?.name || "Mentor"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.scheduled_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleConfirmCompletion(session)}
                        disabled={confirmingId === session.id}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      >
                        {confirmingId === session.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Sessão realizada
                      </Button>
                      <Button
                        onClick={async () => {
                          setConfirmingId(session.id);
                          const { error } = await supabase
                            .from("mentor_sessions")
                            .update({ status: "cancelled", mentor_notes: "Sessão não realizada (confirmado pelo mentorado)" })
                            .eq("id", session.id);
                          if (error) {
                            toast.error("Erro: " + error.message);
                          } else {
                            toast.success("Sessão marcada como não realizada");
                            fetchSessions();
                          }
                          setConfirmingId(null);
                        }}
                        disabled={confirmingId === session.id}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Não realizada
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Tabbed Sessions */}
          <div className="bg-card rounded-2xl shadow-card p-4 md:p-5">
            <Tabs defaultValue={unreviewedCompletedSessions.length > 0 ? "passadas" : "proximas"}>
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="proximas" className="text-xs sm:text-sm gap-1">
                  Próximas
                  {upcomingSessions.length > 0 && (
                    <span className="ml-1 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {upcomingSessions.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="passadas" className="text-xs sm:text-sm gap-1">
                  Passadas
                  {unreviewedCompletedSessions.length > 0 && (
                    <span className="ml-1 bg-destructive/10 text-destructive text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreviewedCompletedSessions.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="todas" className="text-xs sm:text-sm">
                  Todas
                </TabsTrigger>
              </TabsList>

              {/* Próximas */}
              <TabsContent value="proximas">
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col gap-3 p-3 md:p-4 bg-accent/50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {session.mentor?.photo_url ? (
                              <img src={session.mentor.photo_url} alt={session.mentor.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {session.mentor?.name || "Mentor"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {session.mentor?.area}
                            </p>
                            <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDate(session.scheduled_at)}
                            </p>
                            {session.duration && (
                              <Badge variant="secondary" className="text-xs mt-1 bg-primary/10 text-primary border border-primary/20 font-semibold">
                                <Timer className="w-3 h-3 mr-1" />
                                {session.duration} min
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${statusLabels[session.status]?.color || "bg-gray-100"}`}>
                              {statusLabels[session.status]?.icon}
                              {session.confirmed_by_mentor ? "Confirmada" : statusLabels[session.status]?.label || session.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Meeting Link */}
                        {session.meeting_link && (() => {
                          const raw = session.meeting_link;
                          const meetMatch = raw.match(/https?:\/\/meet\.google\.com\/[a-z\-]+/i);
                          const urlMatch = raw.match(/https?:\/\/\S+/i);
                          let href = meetMatch ? meetMatch[0] : urlMatch ? urlMatch[0] : raw.trim();
                          if (href && !href.startsWith("http")) href = `https://${href}`;
                          return href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Video className="w-4 h-4" />
                              <span className="font-medium">Entrar na sessão</span>
                            </a>
                          ) : null;
                        })()}

                        <div className="flex justify-end">
                          <SessionManagement
                            sessionId={session.id}
                            scheduledAt={session.scheduled_at}
                            mentorName={session.mentor?.name || "Mentor"}
                            mentorId={session.mentor_id}
                            menteeName={profile?.name}
                            menteeEmail={user?.email}
                            mentorEmail={session.mentor?.email}
                            userRole="mentee"
                            confirmedByMentor={session.confirmed_by_mentor || false}
                            onUpdate={fetchSessions}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Nenhuma mentoria agendada</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Encontre um mentor e agende uma conversa gratuita!
                    </p>
                    <Button
                      onClick={() => navigate("/mentores")}
                      className="bg-gradient-hero text-primary-foreground rounded-xl shadow-button"
                      size="sm"
                    >
                      Conhecer mentores
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Passadas */}
              <TabsContent value="passadas">
                {allFinished.filter(s => s.status !== "cancelled").length > 0 ? (
                  <div className="space-y-2">
                    {allFinished
                      .filter(s => s.status !== "cancelled")
                      .map((session) => (
                        <PastSessionCard key={session.id} session={session} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma mentoria realizada ainda</p>
                  </div>
                )}
              </TabsContent>

              {/* Todas */}
              <TabsContent value="todas">
                {sessions.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sessions.map((session) => (
                      <PastSessionCard key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma mentoria encontrada</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}

      {/* Review Modal */}
      {sessionToReview && user && (
        <SessionReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          sessionId={sessionToReview.id}
          mentorId={sessionToReview.mentor_id}
          mentorName={sessionToReview.mentor?.name || "Mentor"}
          userId={user.id}
          onReviewSubmitted={fetchSessions}
        />
      )}
    </motion.section>
  );
};

export default MentorshipSection;
