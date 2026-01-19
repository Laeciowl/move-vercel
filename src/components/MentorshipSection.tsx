import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, User, Loader2, CheckCircle, XCircle, Users, Timer, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SessionManagement from "./SessionManagement";
import SessionReviewModal from "./SessionReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    color: "bg-blue-100 text-blue-800",
    icon: <Calendar className="w-3 h-3" />
  },
  completed: { 
    label: "Concluída", 
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="w-3 h-3" />
  },
  cancelled: { 
    label: "Cancelada", 
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="w-3 h-3" />
  },
};

const MentorshipSection = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sessionToReview, setSessionToReview] = useState<MentorSession | null>(null);

  const fetchSessions = async () => {
    if (!user) return;

    // Fetch sessions first, then get mentor data from mentors_public view
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

    // Get unique mentor IDs and session IDs
    const mentorIds = [...new Set(sessionsData.map(s => s.mentor_id))];
    const sessionIds = sessionsData.map(s => s.id);
    
    // Fetch mentor data and reviews in parallel
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

    // Map mentor data to sessions
    const mentorsMap = new Map(
      (mentorsResult.data || []).map(m => [m.id, m])
    );

    // Set of sessions that have reviews
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

  // Helper to check if session time has passed (session is effectively "completed")
  const isSessionPast = (scheduledAt: string, duration: number = 30) => {
    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime <= new Date();
  };

  // Upcoming: scheduled and not yet started
  const upcomingSessions = sessions.filter(
    (s) => s.status === "scheduled" && !isSessionPast(s.scheduled_at, s.duration || 30)
  );

  // Past: either status is not scheduled, or the session time has passed
  const pastSessions = sessions.filter(
    (s) => s.status !== "scheduled" || isSessionPast(s.scheduled_at, s.duration || 30)
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

  return (
    <motion.section
      id="mentorship-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Suas Mentorias</h3>
        </div>
        <button
          onClick={() => navigate("/mentores")}
          className="text-sm text-primary font-medium hover:underline"
        >
          Encontrar mentor →
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div className="bg-card rounded-2xl shadow-card p-5">
              <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Próximas mentorias
              </h4>
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 p-4 bg-accent/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {session.mentor?.photo_url ? (
                          <img
                            src={session.mentor.photo_url}
                            alt={session.mentor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {session.mentor?.name || "Mentor"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {session.mentor?.area}
                        </p>
                        <p className="text-xs text-primary flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(session.scheduled_at)}
                        </p>
                        {session.duration && (
                          <Badge variant="secondary" className="text-xs mt-1 bg-muted/60">
                            <Timer className="w-3 h-3 mr-1" />
                            {session.duration} min
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusLabels[session.status]?.color || "bg-gray-100"}`}>
                          {statusLabels[session.status]?.icon}
                          {session.confirmed_by_mentor ? "Confirmada" : statusLabels[session.status]?.label || session.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Session management buttons for mentee */}
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
                        onUpdate={fetchSessions}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Sessions / History */}
          <div className="bg-card rounded-2xl shadow-card p-5">
            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Histórico de mentorias
            </h4>

            {pastSessions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pastSessions.map((session) => {
                  // Determine effective status for display
                  const isCompleted = session.status === "completed" || 
                    (session.status === "scheduled" && isSessionPast(session.scheduled_at, session.duration || 30));
                  const isCancelled = session.status === "cancelled";
                  
                  const displayStatus = isCancelled 
                    ? statusLabels.cancelled 
                    : isCompleted 
                      ? statusLabels.completed 
                      : statusLabels[session.status] || statusLabels.completed;

                  // Can review if session was completed (not cancelled) and no review yet
                  const canReview = isCompleted && !isCancelled && !session.hasReview;

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between py-3 px-3 border-b border-border last:border-0 bg-accent/30 rounded-lg"
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
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${displayStatus.color}`}>
                          {displayStatus.icon}
                          {displayStatus.label}
                        </span>
                        {canReview && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReviewModal(session)}
                            className="text-xs h-7 gap-1 border-yellow-400/50 text-yellow-600 hover:bg-yellow-50"
                          >
                            <Star className="w-3 h-3" />
                            Avaliar
                          </Button>
                        )}
                        {session.hasReview && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
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
                <button
                  onClick={() => navigate("/mentores")}
                  className="mt-4 bg-gradient-hero text-primary-foreground px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
                >
                  Conhecer mentores
                </button>
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
