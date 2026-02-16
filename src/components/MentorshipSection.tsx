import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Loader2, CheckCircle, XCircle, Users, Timer, Star, Heart, ArrowRight, AlertTriangle, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { useMentorCheck } from "@/hooks/useMentorCheck";
import { usePendingMentorCheck } from "@/hooks/usePendingMentorCheck";
import SessionManagement from "./SessionManagement";
import SessionReviewModal from "./SessionReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  hasReview?: boolean;
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
        .select("session_id")
        .in("session_id", sessionIds)
    ]);

    const mentorsMap = new Map(
      (mentorsResult.data || []).map(m => [m.id, m])
    );

    const reviewedSessionIds = new Set(
      (reviewsResult.data || []).map(r => r.session_id)
    );

    const data = sessionsData.map(session => ({
      ...session,
      mentor: mentorsMap.get(session.mentor_id) || null,
      hasReview: reviewedSessionIds.has(session.id)
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
    
    // Old sessions auto-complete; new sessions need manual confirmation
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

  // Check if mentee has pending confirmations (blocks new bookings)
  // Reviews do NOT block new bookings per platform policy
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

    // Create in-app notification
    try {
      await supabase.functions.invoke("send-notification-email", {
        body: {
          to: user?.email,
          name: profile?.name || "Mentorado",
          type: "session_review_request",
          skipPreferenceCheck: true,
          data: {
            mentorName: session.mentor?.name || "Mentor",
          },
        },
      });
    } catch (err) {
      // Silent fail for notification
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
        // Get mentor tags
        const { data: mentorTags } = await supabase
          .from("mentor_tags")
          .select("tags(slug)")
          .eq("mentor_id", session.mentor_id);

        const tagSlugs = (mentorTags || []).map((mt: any) => mt.tags?.slug).filter(Boolean);

        // Get active trail progress for this user
        const { data: activeTrails } = await supabase
          .from("progresso_trilha")
          .select("trilha_id")
          .eq("mentorado_id", user.id)
          .is("concluido_em", null);

        if (activeTrails && activeTrails.length > 0) {
          const trilhaIds = activeTrails.map(t => t.trilha_id);

          // Find mentoria steps in active trails
          const { data: mentoriaSteps } = await supabase
            .from("passos_trilha")
            .select("id, trilha_id, tags_mentor_requeridas, ordem")
            .in("trilha_id", trilhaIds)
            .eq("tipo", "mentoria");

          for (const step of mentoriaSteps || []) {
            // Check if already completed
            const { data: existing } = await supabase
              .from("progresso_passo")
              .select("id")
              .eq("mentorado_id", user.id)
              .eq("passo_id", step.id)
              .eq("completado", true)
              .maybeSingle();

            if (existing) continue;

            // Check tag match
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

              // Recalculate trail progress
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

              // Find trail name for toast
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

  // Upcoming: scheduled and not yet started
  const upcomingSessions = sessions.filter(
    (s) => s.status === "scheduled" && !isSessionPast(s.scheduled_at, s.duration || 30)
  );

  // Past sessions (completed or cancelled or auto-completed old sessions)
  const pastSessions = sessions.filter(s => {
    if (s.status === "cancelled" || s.status === "completed") return true;
    if (s.status === "scheduled" && isSessionPast(s.scheduled_at, s.duration || 30)) {
      // Only show in history if it's an old session (auto-complete) or already handled
      return !requiresManualConfirmation(s.created_at);
    }
    return false;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground text-sm">Avalie suas mentorias</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Você precisa avaliar suas mentorias concluídas antes de agendar uma nova sessão. Seu feedback é essencial!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* CTA to become a mentor */}
      {showBecomeMentorCta && !isBookingBlocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-700/30"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm">Quer ajudar outros jovens?</h4>
                <p className="text-xs text-muted-foreground">Compartilhe sua experiência e vire um mentor voluntário</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/voluntario")}
              variant="outline"
              size="sm"
              className="border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 gap-1.5 whitespace-nowrap"
            >
              <Heart className="w-3.5 h-3.5" />
              Vire um mentor
            </Button>
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

          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div className="bg-card rounded-2xl shadow-card p-4 md:p-5">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                Próximas mentorias
              </h4>
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
                          <Badge variant="secondary" className="text-[10px] mt-1 bg-muted/60">
                            <Timer className="w-3 h-3 mr-0.5" />
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
                    {session.meeting_link && (
                      <a
                        href={session.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Video className="w-4 h-4" />
                        <span className="font-medium">Entrar na sessão</span>
                      </a>
                    )}

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
            </div>
          )}

          {/* Past Sessions / History */}
          <div className="bg-card rounded-2xl shadow-card p-4 md:p-5">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              Histórico de mentorias
            </h4>

            {pastSessions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pastSessions.map((session) => {
                  const isCompleted = isEffectivelyCompleted(session);
                  const isCancelled = session.status === "cancelled";
                  
                  const displayStatus = isCancelled 
                    ? statusLabels.cancelled 
                    : isCompleted 
                      ? statusLabels.completed 
                      : statusLabels[session.status] || statusLabels.completed;

                  const canReview = isCompleted && !isCancelled && !session.hasReview;

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between py-2.5 px-3 border-b border-border/50 last:border-0 bg-accent/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.mentor?.name || "Mentor"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.scheduled_at).toLocaleDateString("pt-BR")}
                          {session.duration && ` • ${session.duration} min`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 whitespace-nowrap ${displayStatus.color}`}>
                          {displayStatus.icon}
                          {displayStatus.label}
                        </span>
                        {canReview && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewModal(session)}
                            className="text-[10px] h-6 gap-1 border-yellow-400/50 text-yellow-600 hover:bg-yellow-50 px-2"
                          >
                            <Star className="w-3 h-3" />
                            Avaliar
                          </Button>
                        )}
                        {session.hasReview && (
                          <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-1.5">
                            <CheckCircle className="w-3 h-3 mr-0.5" />
                            Avaliada
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Bate um papo com quem já passou por isso
                </p>
                <p className="text-xs text-muted-foreground">
                  Agende uma conversa gratuita com um mentor e tire suas dúvidas sobre carreira
                </p>
                <Button
                  onClick={() => navigate("/mentores")}
                  className="mt-4 bg-gradient-hero text-primary-foreground rounded-xl shadow-button"
                  size="sm"
                >
                  Conhecer mentores
                </Button>
              </div>
            )}
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
