import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, FileText, Video, Loader2, ExternalLink, Clock, CheckCircle, XCircle, Calendar, Award, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MentorSessionConfirmation from "./MentorSessionConfirmation";
import MentorProfileEditor from "./MentorProfileEditor";
import MentorTagsEditor from "./MentorTagsEditor";
import ContentSubmissionModal from "./ContentSubmissionModal";
import MentorProgressMilestones from "./MentorProgressMilestones";
import { useMentorTags } from "@/hooks/useTags";
import { isPast } from "date-fns";

interface Submission {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  content_url: string;
  status: string;
  created_at: string;
}

interface MentorData {
  id: string;
  name: string;
  email: string;
  area: string;
  description: string;
  education: string | null;
  photo_url?: string | null;
  status: string;
  availability: any[];
  min_advance_hours?: number;
  linkedin_url?: string | null;
}

interface MentorSession {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  user_id: string;
  confirmed_by_mentor: boolean;
  mentor_notes: string | null;
  duration?: number;
  completed_at?: string;
  mentee_email?: string;
  mentee_formation?: string | null;
  mentee_objective?: string | null;
  mentee_profile?: {
    name: string;
    phone: string | null;
    photo_url?: string | null;
  };
}

interface MentorStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  uniqueMentees: number;
}

const categoryLabels: Record<string, string> = {
  aulas_lives: "Aulas/Lives",
  templates_arquivos: "Templates/Arquivos",
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: "Pendente", icon: <Clock className="w-3 h-3" />, className: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprovado", icon: <CheckCircle className="w-3 h-3" />, className: "bg-green-100 text-green-700" },
  rejected: { label: "Rejeitado", icon: <XCircle className="w-3 h-3" />, className: "bg-red-100 text-red-700" },
};

const dayLabels: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const VolunteerPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isVolunteer, loading: checkingVolunteer } = useVolunteerCheck();
  const [mentorIdForTags, setMentorIdForTags] = useState<string | null>(null);
  const { mentorTags } = useMentorTags(mentorIdForTags);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [stats, setStats] = useState<MentorStats>({ totalSessions: 0, completedSessions: 0, upcomingSessions: 0, uniqueMentees: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "agenda" | "content">("overview");
  const [submissionModal, setSubmissionModal] = useState<{ isOpen: boolean; category: "aulas_lives" | "templates_arquivos" }>({
    isOpen: false,
    category: "aulas_lives",
  });

  // Check if session time has passed (session is effectively "completed")
  const isSessionPast = (scheduledAt: string, duration: number = 30): boolean => {
    const sessionEndTime = new Date(scheduledAt);
    sessionEndTime.setMinutes(sessionEndTime.getMinutes() + duration);
    return isPast(sessionEndTime);
  };

  // Listen for notification actions to switch tabs
  useEffect(() => {
    const handleNotificationAction = (event: CustomEvent<{ type: string; tab?: string }>) => {
      const { type, tab } = event.detail;
      if (type === "mentorship_request" && tab === "agenda" && mentorData) {
        setActiveTab("agenda");
      } else if (type === "volunteer_approval" && tab === "overview") {
        setActiveTab("overview");
      }
    };

    window.addEventListener("notification-action", handleNotificationAction as EventListener);
    return () => {
      window.removeEventListener("notification-action", handleNotificationAction as EventListener);
    };
  }, [mentorData]);

  useEffect(() => {
    if (!user?.email || !isVolunteer) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user?.email, isVolunteer]);

  const fetchData = async () => {
    if (!user?.email) return;

    // Fetch submissions
    const { data: submissionsData } = await supabase
      .from("volunteer_submissions")
      .select("*")
      .eq("volunteer_email", user.email)
      .order("created_at", { ascending: false });

    if (submissionsData) {
      setSubmissions(submissionsData);
    }

    // Check if user is a mentor
    const { data: mentor } = await supabase
      .from("mentors")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (mentor) {
      setMentorData({
        ...mentor,
        description: mentor.description || "",
        education: mentor.education || null,
        availability: (mentor.availability as any[]) || [],
        min_advance_hours: (mentor as any).min_advance_hours ?? 24,
        linkedin_url: (mentor as any).linkedin_url ?? null,
      });

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from("mentor_sessions")
        .select("*")
        .eq("mentor_id", mentor.id)
        .order("scheduled_at", { ascending: true });

      if (sessionsData && sessionsData.length > 0) {
        // Fetch mentee profiles (avoid `.in()` with empty array)
        const userIds = sessionsData.map((s) => s.user_id);
        let profiles: { user_id: string; name: string; phone: string | null }[] = [];
        let emailsData: { user_id: string; email: string }[] = [];

        if (userIds.length > 0) {
          // Fetch mentee profiles using the RPC function
          const { data: profilesData, error: profilesError } = await supabase
            .rpc("get_mentee_contact_profiles", { session_user_ids: userIds });

          if (!profilesError && profilesData) {
            profiles = profilesData;
          }

          // Fetch mentee emails using the RPC function
          const { data: emailsResult } = await supabase
            .rpc("get_mentee_emails", { session_user_ids: userIds });
          
          if (emailsResult) {
            emailsData = emailsResult;
          }
        }

        const sessionsWithProfiles = sessionsData.map((session) => ({
          ...session,
          mentee_profile: profiles.find((p: { user_id: string }) => p.user_id === session.user_id),
          mentee_email: emailsData.find((e: { user_id: string; email: string }) => e.user_id === session.user_id)?.email,
        }));

        setSessions(sessionsWithProfiles);

        // Calculate stats - count sessions as completed if time has passed
        const completed = sessionsData.filter((s) => {
          if (s.status === "completed" || s.status === "cancelled") return s.status === "completed";
          // For scheduled sessions, check if time has passed
          const endTime = new Date(s.scheduled_at);
          endTime.setMinutes(endTime.getMinutes() + (s.duration || 30));
          return endTime <= new Date();
        }).length;

        const upcoming = sessionsData.filter((s) => {
          if (s.status !== "scheduled") return false;
          const endTime = new Date(s.scheduled_at);
          endTime.setMinutes(endTime.getMinutes() + (s.duration || 30));
          return endTime > new Date();
        }).length;

        const uniqueMentees = new Set(sessionsData.map((s) => s.user_id)).size;

        setStats({
          totalSessions: sessionsData.length,
          completedSessions: completed,
          upcomingSessions: upcoming,
          uniqueMentees,
        });
      }
    }

    setLoading(false);
  };

  if (checkingVolunteer || loading) {
    return null;
  }

  if (!isVolunteer) {
    return null;
  }

  const approvedSubmissions = submissions.filter(s => s.status === "approved");
  const pendingSubmissions = submissions.filter(s => s.status === "pending");

  const now = new Date();
  const scheduledSessions = sessions.filter((s) => s.status === "scheduled");

  // Past sessions (completed automatically when time passed)
  const pastSessions = scheduledSessions.filter((s) =>
    isSessionPast(s.scheduled_at, s.duration || 30)
  );

  // Upcoming sessions (not yet started)
  const upcomingSessions = scheduledSessions.filter(
    (s) => !isSessionPast(s.scheduled_at, s.duration || 30)
  );

  // Sessions marked as completed in DB
  const completedSessions = sessions.filter((s) => s.status === "completed");

  return (
    <motion.div
      id="volunteer-panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 md:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"
          >
            <Heart className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground">Área do voluntário</h3>
            {mentorTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {mentorTags.map((tag) => (
                  <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {mentorData ? mentorData.area : "Suas contribuições"}
              </p>
            )}
          </div>
        </div>
        {mentorData && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Badge 
              variant="outline" 
              className={`text-xs ${
                mentorData.status === "approved"
                  ? "border-green-500/50 text-green-600 bg-green-500/10"
                  : mentorData.status === "pending"
                  ? "border-amber-500/50 text-amber-600 bg-amber-500/10"
                  : "border-red-500/50 text-red-600 bg-red-500/10"
              }`}
            >
              {mentorData.status === "approved" ? "Ativo" : mentorData.status === "pending" ? "Pendente" : "Inativo"}
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Tabs - Minimal with animation */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-xl relative">
        {[
          { id: "overview", label: "Geral" },
          ...(mentorData ? [{ id: "profile", label: "Perfil" }] : []),
          ...(mentorData ? [{ id: "agenda", label: "Agenda" }] : []),
          { id: "content", label: "Conteúdos" },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === tab.id 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabBg"
                className="absolute inset-0 bg-card shadow-sm rounded-lg"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Mentor Impact Stats with Milestones */}
            {mentorData && mentorData.status === "approved" && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Seu impacto
                  </span>
                </div>
                
                {/* Progress bar with milestones */}
                <MentorProgressMilestones completedSessions={stats.completedSessions} />

                {/* Quick stats - Inline */}
                <div className="flex items-center gap-4 text-sm pt-2 border-t border-border/30">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{stats.uniqueMentees}</span> pessoas impactadas
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{stats.upcomingSessions}</span> agendadas
                  </span>
                </div>
              </div>
            )}

            {/* Content Stats - Minimal */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-4 text-center hover:bg-muted/50 transition-colors">
                <div className="text-2xl font-bold text-green-600">{approvedSubmissions.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Aprovados</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center hover:bg-muted/50 transition-colors">
                <div className="text-2xl font-bold text-amber-600">{pendingSubmissions.length}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Em análise</div>
              </div>
            </div>

            {/* Session confirmations */}
            {mentorData && sessions.length > 0 && (
              <MentorSessionConfirmation 
                sessions={sessions} 
                mentorName={mentorData.name}
                mentorEmail={mentorData.email}
                onUpdate={fetchData} 
              />
            )}

            {/* Quick actions - Compact */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubmissionModal({ isOpen: true, category: "aulas_lives" })}
                className="justify-start text-muted-foreground hover:text-foreground rounded-xl"
              >
                <Video className="w-4 h-4 mr-2 text-primary" />
                Enviar Aula
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubmissionModal({ isOpen: true, category: "templates_arquivos" })}
                className="justify-start text-muted-foreground hover:text-foreground rounded-xl"
              >
                <FileText className="w-4 h-4 mr-2 text-primary" />
                Enviar Template
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Submission Modal */}
      <ContentSubmissionModal
        isOpen={submissionModal.isOpen}
        onClose={() => setSubmissionModal({ ...submissionModal, isOpen: false })}
        onSuccess={() => {
          setSubmissionModal({ ...submissionModal, isOpen: false });
          fetchData();
        }}
        category={submissionModal.category}
      />

      {/* Profile Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "profile" && mentorData && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/60 rounded-2xl border border-border/50 p-4"
            >
              <MentorProfileEditor
                mentorId={mentorData.id}
                photoUrl={mentorData.photo_url ?? null}
                name={mentorData.name}
                description={mentorData.description}
                education={mentorData.education}
                linkedinUrl={mentorData.linkedin_url}
                onUpdate={fetchData}
              />
              
              <MentorTagsEditor
                mentorId={mentorData.id}
                onUpdate={fetchData}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agenda Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "agenda" && mentorData && (
          <motion.div 
            key="agenda"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Quick Summary */}
            <div className="bg-muted/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Resumo
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card/50 rounded-lg p-3 text-center border border-border/50">
                  <div className="text-xl font-bold text-primary">{stats.upcomingSessions}</div>
                  <div className="text-xs text-muted-foreground">Agendadas</div>
                </div>
                <div className="bg-card/50 rounded-lg p-3 text-center border border-border/50">
                  <div className="text-xl font-bold text-foreground">{stats.completedSessions}</div>
                  <div className="text-xs text-muted-foreground">Realizadas</div>
                </div>
              </div>
            </div>

            {/* Pending Confirmations Quick View */}
            {sessions.filter(s => s.status === "scheduled" && !s.confirmed_by_mentor && !isSessionPast(s.scheduled_at, s.duration || 30)).length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-700/30">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium text-sm">
                    {sessions.filter(s => s.status === "scheduled" && !s.confirmed_by_mentor && !isSessionPast(s.scheduled_at, s.duration || 30)).length} pedido(s) aguardando confirmação
                  </span>
                </div>
              </div>
            )}

            {/* Link to full agenda page */}
            <Button
              onClick={() => navigate("/mentor/agenda")}
              className="w-full bg-gradient-hero text-primary-foreground rounded-xl py-6 text-base font-semibold shadow-button hover:opacity-90 transition-opacity"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Abrir Agenda Completa
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Gerencie disponibilidade, períodos bloqueados e todas as sessões
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "content" && (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {submissions.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {submissions.map((submission, index) => {
                  const status = statusConfig[submission.status] || statusConfig.pending;
                  return (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start justify-between gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-soft group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {submission.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {submission.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge variant="secondary" className="text-xs rounded-lg">
                            {categoryLabels[submission.category] || submission.category}
                          </Badge>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${status.className}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                      </div>
                      {submission.status === "approved" && (
                        <a
                          href={submission.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 p-2 rounded-lg hover:bg-primary/10 transition-all duration-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border"
              >
                <FileText className="w-14 h-14 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Você ainda não enviou conteúdos</p>
                <p className="text-sm text-muted-foreground/70 mt-1 mb-4">Compartilhe seu conhecimento com a comunidade</p>
                <Button
                  variant="outline"
                  onClick={() => setSubmissionModal({ isOpen: true, category: "templates_arquivos" })}
                  className="rounded-xl"
                >
                  Enviar primeiro conteúdo
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VolunteerPanel;
