import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

      if (sessionsData) {
        // Fetch mentee profiles
        const userIds = sessionsData.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, phone")
          .in("user_id", userIds);

        const sessionsWithProfiles = sessionsData.map(session => ({
          ...session,
          mentee_profile: profiles?.find(p => p.user_id === session.user_id),
        }));

        setSessions(sessionsWithProfiles);

        // Calculate stats
        const now = new Date();
        const completed = sessionsData.filter(s => s.status === "completed").length;
        const upcoming = sessionsData.filter(s => s.status === "scheduled" && new Date(s.scheduled_at) > now).length;
        const uniqueMentees = new Set(sessionsData.map(s => s.user_id)).size;

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
      className="bg-card rounded-2xl shadow-card p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Painel do Voluntário</h3>
            <p className="text-sm text-muted-foreground">
              {mentorData ? mentorData.area : "Gerencie suas contribuições"}
            </p>
          </div>
        </div>
        {mentorData && (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              mentorData.status === "approved"
                ? "bg-green-100 text-green-700"
                : mentorData.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {mentorData.status === "approved" ? "Ativo" : mentorData.status === "pending" ? "Pendente" : "Inativo"}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "overview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Visão Geral
        </button>
        {mentorData && (
          <button
            onClick={() => setActiveTab("agenda")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "agenda" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Agenda
          </button>
        )}
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "content" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Conteúdos
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Mentor Progress Bar - Shows for mentors */}
          {mentorData ? (
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  Seu impacto como Mentor
                </h4>
                <span className="text-xs text-muted-foreground">
                  {stats.completedSessions} {stats.completedSessions === 1 ? "mentoria" : "mentorias"} realizadas
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="relative">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((stats.completedSessions / 10) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>0</span>
                  <span>Meta: 10 mentorias</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{stats.completedSessions}</div>
                  <div className="text-[10px] text-muted-foreground">Realizadas</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{stats.uniqueMentees}</div>
                  <div className="text-[10px] text-muted-foreground">Pessoas</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">{stats.upcomingSessions}</div>
                  <div className="text-[10px] text-muted-foreground">Agendadas</div>
                </div>
              </div>
            </div>
          ) : (
            /* Volunteer without mentor role - show info card */
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3 border border-blue-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-semibold text-foreground">Contribuição como Voluntário</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Você está contribuindo com conteúdos para a comunidade! Para também oferecer mentorias,
                cadastre-se como mentor na página de <a href="/voluntario" className="text-primary hover:underline font-medium">Seja Voluntário</a>.
              </p>
              <div className="bg-white/60 rounded-lg p-3 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium">Total de conteúdos enviados:</span>
                  <span className="text-xl font-bold text-primary">{submissions.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Content Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
              <div className="text-2xl font-bold text-green-700">{approvedSubmissions.length}</div>
              <div className="text-xs text-muted-foreground">Conteúdos aprovados</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
              <div className="text-2xl font-bold text-amber-700">{pendingSubmissions.length}</div>
              <div className="text-xs text-muted-foreground">Em análise</div>
            </div>
          </div>

          {/* Session confirmations - only for mentors */}
          {mentorData && sessions.length > 0 && (
            <MentorSessionConfirmation sessions={sessions} onUpdate={fetchData} />
          )}

          {/* Quick actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Ações rápidas</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmissionModal({ isOpen: true, category: "aulas_lives" })}
                className="flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Enviar Aula/Live
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmissionModal({ isOpen: true, category: "templates_arquivos" })}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Enviar Template
              </Button>
            </div>
          </div>
        </div>
      )}

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
      {activeTab === "agenda" && mentorData && (
        <div className="space-y-6">
          {/* Current availability */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Sua disponibilidade atual
            </h4>
            <div className="flex flex-wrap gap-2">
              {mentorData.availability.length > 0 ? (
                mentorData.availability.map((avail: any) => (
                  <div
                    key={avail.day}
                    className="bg-muted px-3 py-2 rounded-lg text-sm"
                  >
                    <span className="font-medium">{dayLabels[avail.day]}:</span>{" "}
                    <span className="text-muted-foreground">{avail.times?.join(", ") || "Sem horários"}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma disponibilidade configurada</p>
              )}
            </div>
          </div>

          {/* Blocked periods */}
          <div>
            <button
              onClick={() => setShowBlockedPeriods(!showBlockedPeriods)}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Settings className="w-4 h-4" />
              {showBlockedPeriods ? "Ocultar" : "Gerenciar"} períodos bloqueados
            </button>
            
            {showBlockedPeriods && (
              <div className="mt-4">
                <MentorBlockedPeriodsManager mentorId={mentorData.id} />
              </div>
            )}
          </div>

          {/* Upcoming sessions */}
          {upcomingSessions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Próximas sessões ({upcomingSessions.length})
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-accent/50 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {session.mentee_profile?.name || "Mentorado"}
                      </span>
                      {session.confirmed_by_mentor && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="space-y-4">
          {submissions.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {submissions.map((submission) => {
                const status = statusConfig[submission.status] || statusConfig.pending;
                return (
                  <div
                    key={submission.id}
                    className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {submission.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {submission.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[submission.category] || submission.category}
                        </Badge>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.className}`}>
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
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Você ainda não enviou conteúdos</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmissionModal({ isOpen: true, category: "templates_arquivos" })}
                className="mt-3"
              >
                Enviar primeiro conteúdo
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default VolunteerPanel;
