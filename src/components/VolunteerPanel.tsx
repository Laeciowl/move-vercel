import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, FileText, Video, Users, Loader2, ExternalLink, Clock, CheckCircle, XCircle, Calendar, Settings, Award, Mail, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MentorBlockedPeriodsManager from "./MentorBlockedPeriodsManager";
import MentorSessionConfirmation from "./MentorSessionConfirmation";
import MentorAvailabilityEditor from "./MentorAvailabilityEditor";
import SessionManagement from "./SessionManagement";
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
  mentee_email?: string;
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 md:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Área do voluntário</h3>
            <p className="text-xs text-muted-foreground">
              {mentorData ? mentorData.area : "Suas contribuições"}
            </p>
          </div>
        </div>
        {mentorData && (
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
        )}
      </div>

      {/* Tabs - Minimal */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-xl">
        {[
          { id: "overview", label: "Geral" },
          ...(mentorData ? [{ id: "agenda", label: "Agenda" }] : []),
          { id: "content", label: "Conteúdos" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
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
            {/* Mentor Impact Stats - Compact */}
            {mentorData && mentorData.status === "approved" && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    Seu impacto
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stats.completedSessions}/{10} mentorias
                  </span>
                </div>
                
                {/* Progress bar - Minimal */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.completedSessions / 10) * 100, 100)}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>

                {/* Quick stats - Inline */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{stats.completedSessions}</span> realizadas
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{stats.uniqueMentees}</span> pessoas
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

            {/* Availability Editor */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <MentorAvailabilityEditor
                mentorId={mentorData.id}
                initialAvailability={mentorData.availability}
                onUpdate={fetchData}
              />
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
                      className="bg-gradient-to-br from-accent/50 to-accent/30 rounded-2xl p-4 space-y-3 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-soft"
                    >
                      <div className="flex items-center gap-3">
                        {/* Mentee photo */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/30 shrink-0">
                          {session.mentee_profile?.photo_url ? (
                            <img 
                              src={session.mentee_profile.photo_url} 
                              alt={session.mentee_profile.name || "Mentorado"} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-primary/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground block truncate">
                            {session.mentee_profile?.name || "Mentorado"}
                          </span>
                          {session.confirmed_by_mentor && (
                            <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 text-xs mt-0.5">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Confirmado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📅 {format(new Date(session.scheduled_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                      
                      {/* Contact info */}
                      <div className="bg-card/50 rounded-lg p-2 space-y-1 border border-border/50">
                        {session.mentee_email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3 text-primary" />
                            <a href={`mailto:${session.mentee_email}`} className="hover:text-primary transition-colors underline truncate">
                              {session.mentee_email}
                            </a>
                          </div>
                        )}

                        {session.mentee_profile?.phone ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3 text-primary" />
                            <a href={`tel:${session.mentee_profile.phone}`} className="hover:text-primary transition-colors">
                              {session.mentee_profile.phone}
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Telefone não informado pelo mentorado</p>
                        )}
                      </div>

                      {/* Session management for mentor */}
                      <div className="flex justify-end pt-2 border-t border-border/50">
                        <SessionManagement
                          sessionId={session.id}
                          scheduledAt={session.scheduled_at}
                          mentorName={mentorData.name}
                          mentorId={mentorData.id}
                          menteeName={session.mentee_profile?.name}
                          menteeEmail={session.mentee_email}
                          mentorEmail={mentorData.email}
                          userRole="mentor"
                          onUpdate={fetchData}
                        />
                      </div>
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
