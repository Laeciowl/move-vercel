import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, ArrowLeft, Mail, Phone, User, Settings, Award, Loader2, Tag, AlertTriangle, ChevronDown, ChevronRight, PauseCircle, PlayCircle } from "lucide-react";
import MentorMenteeNotes from "@/components/MentorMenteeNotes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import MentorBlockedPeriodsManager from "@/components/MentorBlockedPeriodsManager";
import MentorSessionConfirmation from "@/components/MentorSessionConfirmation";
import MentorAvailabilityEditor from "@/components/MentorAvailabilityEditor";
import MentorAdvanceNoticeEditor from "@/components/MentorAdvanceNoticeEditor";
import MentorTagsEditor from "@/components/MentorTagsEditor";
import SessionManagement from "@/components/SessionManagement";
import WhatsAppTemplates from "@/components/WhatsAppTemplates";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface MentorData {
  id: string;
  name: string;
  email: string;
  area: string;
  status: string;
  availability: any[];
  min_advance_hours?: number;
  temporarily_unavailable?: boolean;
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

const dayLabels: Record<string, string> = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

const MentorAgenda = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isVolunteer, loading: checkingVolunteer } = useVolunteerCheck();
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [stats, setStats] = useState<MentorStats>({ totalSessions: 0, completedSessions: 0, upcomingSessions: 0, uniqueMentees: 0 });
  const [loading, setLoading] = useState(true);
  const [showBlockedPeriods, setShowBlockedPeriods] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [expandedMenteeId, setExpandedMenteeId] = useState<string | null>(null);

  const isSessionPast = (scheduledAt: string, duration: number = 30): boolean => {
    const sessionEndTime = new Date(scheduledAt);
    sessionEndTime.setMinutes(sessionEndTime.getMinutes() + duration);
    return isPast(sessionEndTime);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user?.email || !isVolunteer) {
      if (!checkingVolunteer && !isVolunteer) {
        setLoading(false);
      }
      return;
    }
    fetchData();
  }, [user?.email, isVolunteer, checkingVolunteer]);

  const fetchData = async () => {
    if (!user?.email) return;

    const { data: mentor } = await supabase
      .from("mentors")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (mentor) {
      setMentorData({
        ...mentor,
        availability: (mentor.availability as any[]) || [],
        min_advance_hours: (mentor as any).min_advance_hours ?? 24,
        temporarily_unavailable: (mentor as any).temporarily_unavailable ?? false,
      });

      const { data: sessionsData } = await supabase
        .from("mentor_sessions")
        .select("*")
        .eq("mentor_id", mentor.id)
        .order("scheduled_at", { ascending: true });

      if (sessionsData && sessionsData.length > 0) {
        const userIds = sessionsData.map((s) => s.user_id);
        let profiles: { user_id: string; name: string; phone: string | null }[] = [];
        let emailsData: { user_id: string; email: string }[] = [];

        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .rpc("get_mentee_contact_profiles", { session_user_ids: userIds });

          if (!profilesError && profilesData) {
            profiles = profilesData;
          }

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

        // Filter out cancelled sessions for stats
        const activeSessions = sessionsData.filter((s) => s.status !== "cancelled");

        const completed = activeSessions.filter((s) => {
          if (s.status === "completed") return true;
          const endTime = new Date(s.scheduled_at);
          endTime.setMinutes(endTime.getMinutes() + (s.duration || 30));
          return s.status === "scheduled" && endTime <= new Date();
        }).length;

        const upcoming = activeSessions.filter((s) => {
          if (s.status !== "scheduled") return false;
          const endTime = new Date(s.scheduled_at);
          endTime.setMinutes(endTime.getMinutes() + (s.duration || 30));
          return endTime > new Date();
        }).length;

        const uniqueMentees = new Set(activeSessions.map((s) => s.user_id)).size;

        setStats({
          totalSessions: activeSessions.length,
          completedSessions: completed,
          upcomingSessions: upcoming,
          uniqueMentees,
        });
      }
    }

    setLoading(false);
  };

  if (authLoading || checkingVolunteer || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isVolunteer || !mentorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Você não tem acesso a esta página.</p>
          <Button onClick={() => navigate("/inicio")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const scheduledSessions = sessions.filter((s) => s.status === "scheduled");
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const pastScheduledSessions = scheduledSessions.filter((s) => isSessionPast(s.scheduled_at, s.duration || 30));
  const upcomingSessions = scheduledSessions.filter((s) => !isSessionPast(s.scheduled_at, s.duration || 30));
  // Past sessions: completed + past scheduled (needing confirmation)
  const pastSessions = [...completedSessions, ...pastScheduledSessions];

  const handleConfirmCompletion = async (sessionId: string) => {
    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao confirmar sessão: " + error.message);
      return;
    }

    toast.success("Sessão confirmada como realizada! 🎉");
    fetchData();
  };

  const handleMarkNotCompleted = async (sessionId: string) => {
    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        status: "cancelled",
        mentor_notes: "Sessão não realizada (confirmado pelo mentor)",
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    toast.success("Sessão marcada como não realizada");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gradient-warm py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/inicio")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Minha Agenda</h1>
                  <p className="text-muted-foreground">Gerencie suas mentorias e disponibilidade</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-sm ${
                  mentorData.status === "approved"
                    ? "border-green-500/50 text-green-600 bg-green-500/10"
                    : "border-amber-500/50 text-amber-600 bg-amber-500/10"
                }`}
              >
                {mentorData.status === "approved" ? "Mentor Ativo" : "Pendente"}
              </Badge>
            </div>

            {/* Temporarily Unavailable Toggle */}
            {mentorData.status === "approved" && (
              <div className={`flex items-center justify-between p-4 mt-4 rounded-xl border transition-colors ${
                mentorData.temporarily_unavailable
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50"
                  : "bg-muted/30 border-border/50"
              }`}>
                <div className="flex items-center gap-3">
                  {mentorData.temporarily_unavailable ? (
                    <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {mentorData.temporarily_unavailable ? "Agenda desativada" : "Agenda ativa"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mentorData.temporarily_unavailable 
                        ? "Você está indisponível para mentorados"
                        : "Mentorados podem agendar com você"
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!mentorData.temporarily_unavailable}
                  onCheckedChange={async (checked) => {
                    const { error } = await supabase
                      .from("mentors")
                      .update({ temporarily_unavailable: !checked })
                      .eq("id", mentorData.id);

                    if (error) {
                      toast.error("Erro ao atualizar status: " + error.message);
                    } else {
                      toast.success(checked ? "Agenda reativada! 🎉" : "Agenda desativada temporariamente");
                      fetchData();
                    }
                  }}
                />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.completedSessions}</div>
                <div className="text-xs text-muted-foreground">Realizadas</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.upcomingSessions}</div>
                <div className="text-xs text-muted-foreground">Agendadas</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.uniqueMentees}</div>
                <div className="text-xs text-muted-foreground">Mentorados</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{stats.totalSessions}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Session confirmations */}
        {sessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <MentorSessionConfirmation 
              sessions={sessions} 
              mentorName={mentorData.name}
              mentorEmail={mentorData.email}
              onUpdate={fetchData} 
            />
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Sessions (main focus) */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-6"
          >
            {/* Upcoming Sessions - Collapsible */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Próximas Sessões ({upcomingSessions.length})
              </h3>
              
              {upcomingSessions.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {upcomingSessions.map((session) => {
                    const sessionDuration = session.duration || 30;
                    const isExpanded = expandedSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        className="rounded-xl border border-border/50 overflow-hidden"
                      >
                        {/* Collapsed header - always visible */}
                        <button
                          onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                          className="w-full bg-gradient-to-br from-accent/50 to-accent/30 p-3 flex items-center gap-3 hover:from-accent/70 hover:to-accent/50 transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/30 shrink-0">
                            {session.mentee_profile?.photo_url ? (
                              <img src={session.mentee_profile.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-4 h-4 text-primary/60" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-foreground text-sm block truncate">
                              {session.mentee_profile?.name || "Mentorado"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(session.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })} · {sessionDuration}min
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {session.confirmed_by_mentor && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>

                        {/* Expanded content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-accent/20 space-y-3 border-t border-border/50">
                                <p className="text-sm text-muted-foreground font-medium">
                                  📅 {format(new Date(session.scheduled_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </p>

                                {(session.mentee_objective || session.mentee_formation) && (
                                  <div className="bg-primary/5 rounded-lg p-3 space-y-2 border border-primary/20">
                                    {session.mentee_formation && (
                                      <div className="text-sm">
                                        <span className="font-medium text-foreground">Formação:</span>{" "}
                                        <span className="text-muted-foreground">{session.mentee_formation}</span>
                                      </div>
                                    )}
                                    {session.mentee_objective && (
                                      <div className="text-sm">
                                        <span className="font-medium text-foreground">Objetivo:</span>{" "}
                                        <span className="text-muted-foreground">{session.mentee_objective}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="bg-card/50 rounded-lg p-3 space-y-2 border border-border/50">
                                  {session.mentee_email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="w-4 h-4 text-primary" />
                                      <a href={`mailto:${session.mentee_email}`} className="hover:text-primary transition-colors underline truncate">
                                        {session.mentee_email}
                                      </a>
                                    </div>
                                  )}
                                  {session.mentee_profile?.phone ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="w-4 h-4 text-primary" />
                                      <a href={`tel:${session.mentee_profile.phone}`} className="hover:text-primary transition-colors">
                                        {session.mentee_profile.phone}
                                      </a>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground italic">Telefone não informado</p>
                                  )}
                                </div>

                                <MentorMenteeNotes
                                  mentorId={mentorData.id}
                                  menteeUserId={session.user_id}
                                  menteeName={session.mentee_profile?.name || "Mentorado"}
                                />

                                {session.confirmed_by_mentor && (
                                  <WhatsAppTemplates
                                    menteeName={session.mentee_profile?.name || "Mentorado"}
                                    menteePhone={session.mentee_profile?.phone || null}
                                    scheduledAt={session.scheduled_at}
                                    duration={sessionDuration}
                                    objective={session.mentee_objective || null}
                                  />
                                )}

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
                                    confirmedByMentor={session.confirmed_by_mentor || false}
                                    onUpdate={fetchData}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm bg-muted/30 px-4 py-6 rounded-xl text-center">
                  Nenhuma sessão agendada
                </p>
              )}
            </div>

            {/* Past Sessions - Grouped by Mentee */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Sessões Realizadas ({pastSessions.length})
              </h3>
              
              {pastSessions.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {(() => {
                    // Group sessions by mentee
                    const grouped = pastSessions.reduce((acc, session) => {
                      const key = session.user_id;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(session);
                      return acc;
                    }, {} as Record<string, MentorSession[]>);

                    return Object.entries(grouped).map(([menteeId, menteeSessions]) => {
                      const firstSession = menteeSessions[0];
                      const menteeName = firstSession.mentee_profile?.name || "Mentorado";
                      const photoUrl = firstSession.mentee_profile?.photo_url;
                      const isExpanded = expandedMenteeId === menteeId;
                      const needsConfirmationCount = menteeSessions.filter(s => s.status === "scheduled").length;

                      return (
                        <div key={menteeId} className="rounded-xl border border-border/50 overflow-hidden">
                          <button
                            onClick={() => setExpandedMenteeId(isExpanded ? null : menteeId)}
                            className="w-full bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-900/20 dark:to-green-800/10 p-3 flex items-center gap-3 hover:from-green-50/80 hover:to-green-100/50 dark:hover:from-green-900/30 dark:hover:to-green-800/20 transition-colors text-left"
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center overflow-hidden border-2 border-green-500/30 shrink-0">
                              {photoUrl ? (
                                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-4 h-4 text-green-600/60" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-foreground text-sm block truncate">{menteeName}</span>
                              <span className="text-xs text-muted-foreground">
                                {menteeSessions.length} {menteeSessions.length === 1 ? "sessão" : "sessões"}
                                {needsConfirmationCount > 0 && (
                                  <span className="text-amber-600 ml-1">· {needsConfirmationCount} pendente{needsConfirmationCount > 1 ? "s" : ""}</span>
                                )}
                              </span>
                            </div>
                            {needsConfirmationCount > 0 && (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-3 space-y-2 bg-muted/20 border-t border-border/50">
                                  {menteeSessions.map((session) => {
                                    const needsConfirmation = session.status === "scheduled";
                                    return (
                                      <div
                                        key={session.id}
                                        className={`rounded-lg p-3 space-y-2 border ${
                                          needsConfirmation
                                            ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-700/30"
                                            : "bg-card border-border/50"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <p className="text-sm text-muted-foreground">
                                            📅 {format(new Date(session.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                          </p>
                                          {needsConfirmation ? (
                                            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                              Pendente
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                              <CheckCircle className="w-3 h-3 mr-1" />
                                              Realizada
                                            </Badge>
                                          )}
                                        </div>

                                        {(session.mentee_objective || session.mentee_formation) && (
                                          <div className="bg-primary/5 rounded-lg p-2 space-y-1 text-xs border border-primary/10">
                                            {session.mentee_formation && (
                                              <div><span className="font-medium text-foreground">Formação:</span> <span className="text-muted-foreground">{session.mentee_formation}</span></div>
                                            )}
                                            {session.mentee_objective && (
                                              <div><span className="font-medium text-foreground">Objetivo:</span> <span className="text-muted-foreground">{session.mentee_objective}</span></div>
                                            )}
                                          </div>
                                        )}

                                        {session.mentor_notes && (
                                          <p className="text-xs text-muted-foreground italic">📝 {session.mentor_notes}</p>
                                        )}

                                        {needsConfirmation && (
                                          <div className="flex gap-2 pt-1">
                                            <Button
                                              size="sm"
                                              onClick={() => handleConfirmCompletion(session.id)}
                                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                                            >
                                              <CheckCircle className="w-3 h-3 mr-1" />
                                              Confirmar
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleMarkNotCompleted(session.id)}
                                              className="flex-1 text-xs text-destructive border-destructive/50 hover:bg-destructive/10 h-8"
                                            >
                                              Não realizada
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}

                                  {/* Mentor notes for this mentee - shown once per mentee group */}
                                  <MentorMenteeNotes
                                    mentorId={mentorData.id}
                                    menteeUserId={menteeId}
                                    menteeName={menteeName}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm bg-muted/30 px-4 py-6 rounded-xl text-center">
                  Nenhuma sessão realizada ainda
                </p>
              )}
            </div>
          </motion.div>

          {/* Right Column - Availability Settings */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Mentor Tags */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Áreas de Mentoria
              </h3>
              <MentorTagsEditor
                mentorId={mentorData.id}
                onUpdate={fetchData}
              />
            </div>

            {/* Advance Notice */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Antecedência Mínima
              </h3>
              <MentorAdvanceNoticeEditor
                mentorId={mentorData.id}
                minAdvanceHours={mentorData.min_advance_hours ?? 24}
                onUpdate={fetchData}
              />
            </div>

            {/* Current Availability */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Disponibilidade Atual
              </h3>
              <div className="space-y-3 mb-6">
                {mentorData.availability.length > 0 ? (
                  mentorData.availability.map((avail: any) => (
                    <div
                      key={avail.day}
                      className="bg-muted/50 px-4 py-3 rounded-xl border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{dayLabels[avail.day]}</span>
                        {avail.duration && (
                          <Badge variant="outline" className="text-xs">
                            {avail.duration === 60 ? "1h" : `${avail.duration} min`}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {avail.times?.map((time: string) => (
                          <Badge key={time} variant="secondary" className="text-xs">
                            {time}
                          </Badge>
                        )) || <span className="text-muted-foreground text-sm">Sem horários</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm bg-muted/30 px-4 py-3 rounded-xl">
                    Nenhuma disponibilidade configurada
                  </p>
                )}
              </div>

              <MentorAvailabilityEditor
                mentorId={mentorData.id}
                initialAvailability={mentorData.availability}
                onUpdate={fetchData}
              />
            </div>

            {/* Blocked Periods */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <button
                onClick={() => setShowBlockedPeriods(!showBlockedPeriods)}
                className="flex items-center gap-2 text-foreground hover:text-primary transition-colors w-full"
              >
                <Settings className="w-5 h-5" />
                <span className="font-semibold">Períodos Bloqueados</span>
                <span className="text-sm text-muted-foreground ml-auto">
                  {showBlockedPeriods ? "Ocultar" : "Gerenciar"}
                </span>
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
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MentorAgenda;
