import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, ArrowLeft, Mail, Phone, User, Settings, Award, Loader2, Tag } from "lucide-react";
import MentorMenteeNotes from "@/components/MentorMenteeNotes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MentorBlockedPeriodsManager from "@/components/MentorBlockedPeriodsManager";
import MentorSessionConfirmation from "@/components/MentorSessionConfirmation";
import MentorAvailabilityEditor from "@/components/MentorAvailabilityEditor";
import MentorAdvanceNoticeEditor from "@/components/MentorAdvanceNoticeEditor";
import MentorTagsEditor from "@/components/MentorTagsEditor";
import SessionManagement from "@/components/SessionManagement";
import WhatsAppTemplates from "@/components/WhatsAppTemplates";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MentorData {
  id: string;
  name: string;
  email: string;
  area: string;
  status: string;
  availability: any[];
  min_advance_hours?: number;
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

        const completed = sessionsData.filter((s) => {
          if (s.status === "completed" || s.status === "cancelled") return s.status === "completed";
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
  const pastSessions = scheduledSessions.filter((s) => isSessionPast(s.scheduled_at, s.duration || 30));
  const upcomingSessions = scheduledSessions.filter((s) => !isSessionPast(s.scheduled_at, s.duration || 30));

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
            {/* Upcoming Sessions */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Próximas Sessões ({upcomingSessions.length})
              </h3>
              
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {upcomingSessions.map((session) => {
                    const sessionDuration = session.duration || 30;

                    return (
                      <div
                        key={session.id}
                        className="bg-gradient-to-br from-accent/50 to-accent/30 rounded-xl p-4 space-y-3 border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/30 shrink-0">
                            {session.mentee_profile?.photo_url ? (
                              <img
                                src={session.mentee_profile.photo_url}
                                alt={session.mentee_profile.name || "Mentorado"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-primary/60" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-foreground block truncate">
                              {session.mentee_profile?.name || "Mentorado"}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {session.confirmed_by_mentor && (
                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Confirmado
                                </Badge>
                              )}
                              <Badge className="text-xs bg-primary/15 text-primary border border-primary/30">
                                <Clock className="w-3 h-3 mr-1" />
                                {sessionDuration} min
                              </Badge>
                            </div>
                          </div>
                        </div>

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
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm bg-muted/30 px-4 py-6 rounded-xl text-center">
                  Nenhuma sessão agendada
                </p>
              )}
            </div>

            {/* Past Sessions */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Sessões Realizadas ({pastSessions.length})
              </h3>
              
              {pastSessions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {pastSessions.map((session) => {
                    const sessionDuration = session.duration || 30;

                    return (
                      <div
                        key={session.id}
                        className="bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 space-y-2 border border-green-200/50 dark:border-green-700/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center overflow-hidden border-2 border-green-500/30 shrink-0">
                            {session.mentee_profile?.photo_url ? (
                              <img
                                src={session.mentee_profile.photo_url}
                                alt={session.mentee_profile.name || "Mentorado"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-green-600/60" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground block truncate">
                              {session.mentee_profile?.name || "Mentorado"}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Realizada
                              </Badge>
                              <Badge className="text-xs bg-primary/15 text-primary border border-primary/30">
                                {sessionDuration} min
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          📅 {format(new Date(session.scheduled_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    );
                  })}
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
                      <span className="font-medium text-foreground">{dayLabels[avail.day]}</span>
                      <div className="flex flex-wrap gap-2 mt-2">
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
