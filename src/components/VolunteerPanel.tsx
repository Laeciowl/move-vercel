import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, FileText, Video, Users, Loader2, ExternalLink, Clock, CheckCircle, XCircle, Calendar, Settings, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MentorBlockedPeriodsManager from "./MentorBlockedPeriodsManager";
import MentorSessionConfirmation from "./MentorSessionConfirmation";
import ContentSubmissionModal from "./ContentSubmissionModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  status: string;
  availability: any[];
}

interface MentorSession {
  id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  user_id: string;
  confirmed_by_mentor: boolean;
  mentor_notes: string | null;
  mentee_profile?: {
    name: string;
    phone: string | null;
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
  const { user } = useAuth();
  const { isVolunteer, loading: checkingVolunteer } = useVolunteerCheck();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [stats, setStats] = useState<MentorStats>({ totalSessions: 0, completedSessions: 0, upcomingSessions: 0, uniqueMentees: 0 });
  const [loading, setLoading] = useState(true);
  const [showBlockedPeriods, setShowBlockedPeriods] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "agenda" | "content">("overview");
  const [submissionModal, setSubmissionModal] = useState<{ isOpen: boolean; category: "aulas_lives" | "templates_arquivos" }>({
    isOpen: false,
    category: "aulas_lives",
  });

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
        availability: (mentor.availability as any[]) || [],
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

        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("user_id, name, phone")
            .in("user_id", userIds);

          if (!profilesError && profilesData) {
            profiles = profilesData;
          }
        }

        const sessionsWithProfiles = sessionsData.map((session) => ({
          ...session,
          mentee_profile: profiles.find((p) => p.user_id === session.user_id),
        }));

        setSessions(sessionsWithProfiles);

        // Calculate stats
        const now = new Date();
        const completed = sessionsData.filter((s) => s.status === "completed").length;
        const upcoming = sessionsData.filter(
          (s) => s.status === "scheduled" && new Date(s.scheduled_at) > now
        ).length;
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
  const upcomingSessions = sessions.filter(s => s.status === "scheduled" && new Date(s.scheduled_at) > new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative bg-card/80 backdrop-blur-sm rounded-3xl shadow-card border border-border/50 p-6 space-y-6 overflow-hidden group"
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-button"
          >
            <Heart className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Sua área de voluntário</h3>
            <p className="text-sm text-muted-foreground">
              {mentorData ? mentorData.area : "Aqui você acompanha suas contribuições"}
            </p>
          </div>
        </div>
        {mentorData && (
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              mentorData.status === "approved"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : mentorData.status === "pending"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {mentorData.status === "approved" ? "Ativo" : mentorData.status === "pending" ? "Pendente" : "Inativo"}
          </motion.span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-2">
        {[
          { id: "overview", label: "Visão Geral" },
          ...(mentorData ? [{ id: "agenda", label: "Agenda" }] : []),
          { id: "content", label: "Conteúdos" },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === tab.id 
                ? "bg-primary text-primary-foreground shadow-button" 
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Mentor Progress Bar - Shows for mentors with approved status */}
            {mentorData && mentorData.status === "approved" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-2xl p-5 space-y-4 border border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    O impacto que você está gerando
                  </h4>
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                    {stats.completedSessions} {stats.completedSessions === 1 ? "mentoria" : "mentorias"} realizadas
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="relative">
                  <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.completedSessions / 10) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>0</span>
                    <span>Meta: 10 mentorias</span>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { value: stats.completedSessions, label: "Realizadas", color: "text-primary" },
                    { value: stats.uniqueMentees, label: "Pessoas", color: "text-green-600 dark:text-green-400" },
                    { value: stats.upcomingSessions, label: "Agendadas", color: "text-blue-600 dark:text-blue-400" },
                  ].map((stat, index) => (
                    <motion.div 
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="text-center bg-card/50 rounded-xl p-3 border border-border/50"
                    >
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Content Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 rounded-2xl p-4 text-center border border-green-200/50 dark:border-green-800/50 hover:shadow-soft transition-all duration-300 group"
              >
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 transition-transform duration-300 group-hover:scale-110">{approvedSubmissions.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Conteúdos aprovados</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 rounded-2xl p-4 text-center border border-amber-200/50 dark:border-amber-800/50 hover:shadow-soft transition-all duration-300 group"
              >
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110">{pendingSubmissions.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Em análise</div>
              </motion.div>
            </div>

            {/* Session confirmations - only for mentors */}
            {mentorData && sessions.length > 0 && (
              <MentorSessionConfirmation 
                sessions={sessions} 
                mentorName={mentorData.name}
                mentorEmail={mentorData.email}
                onUpdate={fetchData} 
              />
            )}

            {/* Quick actions */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h4 className="text-sm font-semibold text-foreground">Ações rápidas</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSubmissionModal({ isOpen: true, category: "aulas_lives" })}
                  className="flex items-center gap-2 rounded-xl py-5 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  <Video className="w-5 h-5 text-primary" />
                  <span>Enviar Aula/Live</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSubmissionModal({ isOpen: true, category: "templates_arquivos" })}
                  className="flex items-center gap-2 rounded-xl py-5 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Enviar Template</span>
                </Button>
              </div>
            </motion.div>
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

      {/* Agenda Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "agenda" && mentorData && (
          <motion.div 
            key="agenda"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Current availability */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Sua disponibilidade atual
              </h4>
              <div className="flex flex-wrap gap-2">
                {mentorData.availability.length > 0 ? (
                  mentorData.availability.map((avail: any, index: number) => (
                    <motion.div
                      key={avail.day}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + index * 0.05 }}
                      className="bg-muted/50 px-4 py-2.5 rounded-xl text-sm border border-border/50 hover:border-primary/30 transition-all duration-300"
                    >
                      <span className="font-medium text-foreground">{dayLabels[avail.day]}:</span>{" "}
                      <span className="text-muted-foreground">{avail.times?.join(", ") || "Sem horários"}</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground bg-muted/30 px-4 py-3 rounded-xl">Nenhuma disponibilidade configurada</p>
                )}
              </div>
            </motion.div>

            {/* Blocked periods */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => setShowBlockedPeriods(!showBlockedPeriods)}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
              >
                <Settings className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                {showBlockedPeriods ? "Ocultar" : "Gerenciar"} períodos bloqueados
              </button>
              
              <AnimatePresence>
                {showBlockedPeriods && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 overflow-hidden"
                  >
                    <MentorBlockedPeriodsManager mentorId={mentorData.id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Upcoming sessions */}
            {upcomingSessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Próximas sessões ({upcomingSessions.length})
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {upcomingSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-gradient-to-br from-accent/50 to-accent/30 rounded-2xl p-4 space-y-2 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-soft"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {session.mentee_profile?.name || "Mentorado"}
                        </span>
                        {session.confirmed_by_mentor && (
                          <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirmado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📅 {format(new Date(session.scheduled_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {session.mentee_profile?.phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {session.mentee_profile.phone}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
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
