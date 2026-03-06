import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Loader2, User, Shield, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MentorSessionConfirmation from "./MentorSessionConfirmation";

import { useMentorTags } from "@/hooks/useTags";
import { isPast, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import SessionManagement from "./SessionManagement";

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
  mentor_id: string;
  mentee_profile?: {
    name: string;
    phone: string | null;
    photo_url?: string | null;
  };
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

interface MentorStats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  uniqueMentees: number;
  totalMinutes: number;
}

const isSessionPast = (scheduledAt: string, duration: number = 30): boolean => {
  const sessionEndTime = new Date(scheduledAt);
  sessionEndTime.setMinutes(sessionEndTime.getMinutes() + duration);
  return isPast(sessionEndTime);
};

const VolunteerPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isVolunteer, loading: checkingVolunteer } = useVolunteerCheck();
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [stats, setStats] = useState<MentorStats>({ totalSessions: 0, completedSessions: 0, upcomingSessions: 0, uniqueMentees: 0, totalMinutes: 0 });
  const [loading, setLoading] = useState(true);
  const { mentorTags } = useMentorTags(mentorData?.id || null);

  useEffect(() => {
    if (!user?.email || !isVolunteer) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [user?.email, isVolunteer]);

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
        description: mentor.description || "",
        education: mentor.education || null,
        availability: (mentor.availability as any[]) || [],
        min_advance_hours: (mentor as any).min_advance_hours ?? 24,
        linkedin_url: (mentor as any).linkedin_url ?? null,
      });

      const { data: sessionsData } = await supabase
        .from("mentor_sessions")
        .select("*")
        .eq("mentor_id", mentor.id)
        .order("scheduled_at", { ascending: true });

      if (sessionsData && sessionsData.length > 0) {
        const userIds = sessionsData.map((s) => s.user_id);
        let profiles: any[] = [];
        let emailsData: any[] = [];

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase.rpc("get_mentee_contact_profiles", { session_user_ids: userIds });
          if (profilesData) profiles = profilesData;
          const { data: emailsResult } = await supabase.rpc("get_mentee_emails", { session_user_ids: userIds });
          if (emailsResult) emailsData = emailsResult;
        }

        const sessionsWithProfiles = sessionsData.map((session) => ({
          ...session,
          mentee_profile: profiles.find((p: any) => p.user_id === session.user_id),
          mentee_email: emailsData.find((e: any) => e.user_id === session.user_id)?.email,
        }));

        setSessions(sessionsWithProfiles);

        const completedSessionsList = sessionsData.filter((s) => {
          if (s.status === "completed") return true;
          if (s.status === "cancelled") return false;
          return isSessionPast(s.scheduled_at, s.duration || 30);
        });
        const completed = completedSessionsList.length;
        const upcoming = sessionsData.filter((s) => s.status === "scheduled" && !isSessionPast(s.scheduled_at, s.duration || 30)).length;
        const uniqueMentees = new Set(completedSessionsList.map((s) => s.user_id)).size;
        const totalMinutes = completedSessionsList.reduce((sum, s) => sum + (s.duration || 30), 0);

        setStats({ totalSessions: sessionsData.length, completedSessions: completed, upcomingSessions: upcoming, uniqueMentees, totalMinutes });
      }
    }
    setLoading(false);
  };

  if (checkingVolunteer || loading) return null;
  if (!isVolunteer || !mentorData) return null;

  const scheduledSessions = sessions.filter((s) => s.status === "scheduled");
  const pastUnconfirmed = scheduledSessions.filter((s) => isSessionPast(s.scheduled_at, s.duration || 30));
  const upcomingSessions = scheduledSessions.filter((s) => !isSessionPast(s.scheduled_at, s.duration || 30));
  const pendingRequests = upcomingSessions.filter((s) => !s.confirmed_by_mentor);
  const confirmedUpcoming = upcomingSessions.filter((s) => s.confirmed_by_mentor);

  const hasAnyActivity = pendingRequests.length > 0 || pastUnconfirmed.length > 0 || confirmedUpcoming.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Header - Mentor Status */}
      <div className="bg-card rounded-2xl border border-border/40 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Área do Mentor</h3>
            {mentorTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {mentorTags.slice(0, 3).map((tag) => (
                  <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                    {tag.name}
                  </span>
                ))}
                {mentorTags.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                    +{mentorTags.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{mentorData.area}</p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${
            mentorData.status === "approved"
              ? "border-green-500/50 text-green-600 bg-green-500/10"
              : "border-amber-500/50 text-amber-600 bg-amber-500/10"
          }`}
        >
          {mentorData.status === "approved" ? "Ativo" : "Pendente"}
        </Badge>
        </div>
      </div>

      {/* NÍVEL 1: Solicitações Pendentes */}
      {pendingRequests.length > 0 && (
        <MentorSessionConfirmation
          sessions={sessions}
          mentorName={mentorData.name}
          mentorEmail={mentorData.email}
          onUpdate={fetchData}
        />
      )}

      {/* NÍVEL 2: Sessões Passadas aguardando confirmação de realização */}
      {pastUnconfirmed.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-500" />
            Confirme se aconteceram ({pastUnconfirmed.length})
          </h4>
          {pastUnconfirmed.map((session) => (
            <div
              key={session.id}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden shrink-0">
                  {session.mentee_profile?.photo_url ? (
                    <img src={session.mentee_profile.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {session.mentee_profile?.name || "Mentorado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.scheduled_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Por favor, confirme que a sessão aconteceu
              </p>
              <SessionManagement
                sessionId={session.id}
                scheduledAt={session.scheduled_at}
                mentorName={mentorData.name}
                mentorId={mentorData.id}
                menteeName={session.mentee_profile?.name}
                menteeEmail={session.mentee_email}
                mentorEmail={mentorData.email}
                userRole="mentor"
                isPastSession={true}
                onUpdate={fetchData}
                onConfirmCompletion={async () => {
                  const { error } = await supabase
                    .from("mentor_sessions")
                    .update({ status: "completed", completed_at: new Date().toISOString() })
                    .eq("id", session.id);
                  if (!error) {
                    (await import("sonner")).toast.success("Sessão confirmada como realizada!");
                    fetchData();
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* NÍVEL 3: Próximas Mentorias Confirmadas */}
      {confirmedUpcoming.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-500" />
            Próximas mentorias ({confirmedUpcoming.length})
          </h4>
          {confirmedUpcoming.slice(0, 3).map((session) => (
            <div
              key={session.id}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center overflow-hidden shrink-0">
                  {session.mentee_profile?.photo_url ? (
                    <img src={session.mentee_profile.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {session.mentee_profile?.name || "Mentorado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(session.scheduled_at), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
              {session.mentee_objective && (
                <p className="text-xs text-muted-foreground mt-2 italic">"{session.mentee_objective}"</p>
              )}
              <div className="mt-3">
                <SessionManagement
                  sessionId={session.id}
                  scheduledAt={session.scheduled_at}
                  mentorName={mentorData.name}
                  mentorId={mentorData.id}
                  menteeName={session.mentee_profile?.name}
                  menteeEmail={session.mentee_email}
                  mentorEmail={mentorData.email}
                  userRole="mentor"
                  confirmedByMentor={true}
                  onUpdate={fetchData}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NÍVEL 4: Estado Vazio */}
      {!hasAnyActivity && (
        <div className="text-center py-8 bg-card rounded-2xl border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-foreground">Nenhuma mentoria agendada no momento</p>
          <p className="text-sm text-muted-foreground mt-1">Quando mentorados solicitarem, aparecerá aqui</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/mentores")}
            className="mt-4"
          >
            Ver Meu Perfil Público
          </Button>
        </div>
      )}

      {/* Stats removed - moved to /mentor/perfil */}
    </motion.div>
  );
};

export default VolunteerPanel;
