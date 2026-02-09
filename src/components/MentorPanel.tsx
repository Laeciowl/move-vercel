import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Calendar, Clock, Settings, Shield, Loader2, Phone, CheckCircle, Mail, PauseCircle, PlayCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useMentorTags } from "@/hooks/useTags";
import MentorBlockedPeriodsManager from "./MentorBlockedPeriodsManager";
import MentorDisclaimerModal from "./MentorDisclaimerModal";
import MentorSessionConfirmation from "./MentorSessionConfirmation";
import MentorAvailabilityEditor from "./MentorAvailabilityEditor";
import MentorProfileEditor from "./MentorProfileEditor";
import MentorAdvanceNoticeEditor from "./MentorAdvanceNoticeEditor";
import MentorTagsEditor from "./MentorTagsEditor";
import MentorFeaturedAchievementsEditor from "./MentorFeaturedAchievementsEditor";
import SessionManagement from "./SessionManagement";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
interface Availability {
  day: string;
  times: string[];
  duration?: number;
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
  availability: Availability[];
  disclaimer_accepted: boolean;
  disclaimer_accepted_at: string | null;
  min_advance_hours?: number;
  linkedin_url?: string | null;
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
  mentee_email?: string;
  mentee_formation?: string | null;
  mentee_objective?: string | null;
  mentee_profile?: {
    name: string;
    phone: string | null;
    photo_url?: string | null;
  };
}

const dayLabels: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const MentorPanel = () => {
  const { user } = useAuth();
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showBlockedPeriods, setShowBlockedPeriods] = useState(false);
  const { mentorTags } = useMentorTags(mentorData?.id || null);

  useEffect(() => {
    if (!user?.email) return;
    fetchMentorData();
  }, [user?.email]);

  const fetchMentorData = async () => {
    if (!user?.email) return;

    // Check if user is a mentor by email
    const { data: mentor, error } = await supabase
      .from("mentors")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (mentor && !error) {
      setMentorData({
        ...mentor,
        education: mentor.education || null,
        availability: (mentor.availability as unknown as Availability[]) || [],
        min_advance_hours: (mentor as any).min_advance_hours ?? 24,
        linkedin_url: (mentor as any).linkedin_url ?? null,
        temporarily_unavailable: (mentor as any).temporarily_unavailable ?? false,
      });

      // Fetch upcoming sessions with mentee info
      const { data: sessionsData } = await supabase
        .from("mentor_sessions")
        .select("*")
        .eq("mentor_id", mentor.id)
        .order("scheduled_at", { ascending: true });

      if (sessionsData) {
        // Fetch mentee profiles using the RPC function
        const userIds = sessionsData.map(s => s.user_id);
        const { data: profiles } = await supabase
          .rpc("get_mentee_contact_profiles", { session_user_ids: userIds });

        // Fetch mentee emails using the RPC function
        const { data: emailsData } = await supabase
          .rpc("get_mentee_emails", { session_user_ids: userIds });

        const sessionsWithProfiles = sessionsData.map(session => ({
          ...session,
          mentee_profile: profiles?.find((p: { user_id: string }) => p.user_id === session.user_id),
          mentee_email: emailsData?.find((e: { user_id: string; email: string }) => e.user_id === session.user_id)?.email,
        }));

        setSessions(sessionsWithProfiles);
      }
    }

    setLoading(false);
  };

  const handleAcceptDisclaimer = async () => {
    if (!mentorData) return;

    const { error } = await supabase
      .from("mentors")
      .update({
        disclaimer_accepted: true,
        disclaimer_accepted_at: new Date().toISOString(),
        status: "pending", // Reset to pending for admin approval
      })
      .eq("id", mentorData.id);

    if (error) {
      toast.error("Erro ao aceitar termos: " + error.message);
    } else {
      toast.success("Termos aceitos! Seu perfil será analisado pela administração.");
      setShowDisclaimerModal(false);
      fetchMentorData();
    }
  };

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!mentorData) {
    return null; // User is not a mentor
  }

  const upcomingSessions = sessions.filter(
    s => s.status === "scheduled" && new Date(s.scheduled_at) > new Date()
  );

  return (
    <motion.div
      id="mentor-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative bg-card/80 backdrop-blur-sm rounded-3xl shadow-card border border-border/50 p-6 space-y-6 overflow-hidden group"
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-button"
          >
            <Shield className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Sua área de mentor</h3>
            {mentorTags.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {mentorTags.map((tag) => (
                  <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{mentorData.area}</p>
            )}
          </div>
        </div>
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
          {statusLabels[mentorData.status]}
        </motion.span>
      </div>

      {/* Disclaimer status */}
      {!mentorData.disclaimer_accepted ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-accent/50 to-accent/30 rounded-2xl p-4 space-y-3 border border-primary/20"
        >
          <p className="text-sm text-foreground font-medium">
            ⚠️ Para ativar seu perfil de mentor, você precisa aceitar os termos de compromisso.
          </p>
          <button
            onClick={() => setShowDisclaimerModal(true)}
            className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground py-3 rounded-xl font-medium text-sm hover:shadow-button transition-all duration-300 hover:-translate-y-0.5"
          >
            Aceitar termos e ativar perfil
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Termos aceitos em {format(new Date(mentorData.disclaimer_accepted_at!), "dd/MM/yyyy", { locale: ptBR })}</span>
        </motion.div>
      )}

      {/* Temporarily Unavailable Toggle */}
      {mentorData.status === "approved" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
            mentorData.temporarily_unavailable
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50"
              : "bg-card/60 border-border/50"
          }`}
        >
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
                  ? "Você está aparecendo como indisponível para mentorados"
                  : "Mentorados podem agendar sessões com você"
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
                fetchMentorData();
              }
            }}
          />
        </motion.div>
      )}

      {/* Perfil */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-card/60 rounded-2xl border border-border/50 p-4 space-y-4"
      >
        <MentorProfileEditor
          mentorId={mentorData.id}
          photoUrl={mentorData.photo_url ?? null}
          name={mentorData.name}
          description={mentorData.description}
          education={mentorData.education}
          linkedinUrl={mentorData.linkedin_url}
          onUpdate={fetchMentorData}
        />
        
        <MentorTagsEditor
          mentorId={mentorData.id}
          onUpdate={fetchMentorData}
        />

        <MentorFeaturedAchievementsEditor mentorId={mentorData.id} />
      </motion.div>

      {/* Agenda */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card/60 rounded-2xl border border-border/50 p-4 space-y-4"
      >
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Agenda
        </h4>

        <MentorAdvanceNoticeEditor
          mentorId={mentorData.id}
          minAdvanceHours={mentorData.min_advance_hours ?? 24}
          onUpdate={fetchMentorData}
        />

        {/* Availability summary */}
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Sua disponibilidade
            </h5>
            <div className="flex flex-wrap gap-2">
              {mentorData.availability.map((avail, index) => (
                <motion.div
                  key={avail.day}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="bg-muted/50 px-3 py-2 rounded-xl text-xs text-foreground border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <span className="font-medium">{dayLabels[avail.day]}:</span> {avail.times.join(", ")}
                  {avail.duration && (
                    <span className="text-muted-foreground ml-1">({avail.duration === 60 ? "1h" : `${avail.duration}min`})</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

        <MentorAvailabilityEditor
          mentorId={mentorData.id}
          initialAvailability={mentorData.availability}
          onUpdate={fetchMentorData}
        />

        {/* Blocked periods toggle */}
        <div>
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
        </div>
      </motion.div>

      {/* Session Confirmation */}
      <MentorSessionConfirmation 
        sessions={sessions} 
        mentorName={mentorData.name}
        mentorEmail={mentorData.email}
        onUpdate={fetchMentorData} 
      />

      {/* Upcoming sessions */}
      {upcomingSessions.filter(s => s.confirmed_by_mentor).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Próximas sessões ({upcomingSessions.length})
          </h4>
          <div className="space-y-3">
            {upcomingSessions.filter(s => s.confirmed_by_mentor).slice(0, 3).map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
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
                  <div>
                    <span className="font-medium text-foreground block">
                      {session.mentee_profile?.name || "Mentorado"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session.confirmed_by_mentor && (
                        <span className="text-green-600 dark:text-green-400 font-medium">✓ Confirmado</span>
                      )}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  📅 {formatSessionDate(session.scheduled_at)}
                </p>

                {/* Formation and Objective */}
                {(session.mentee_formation || session.mentee_objective) && (
                  <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-lg p-3 space-y-2 border border-blue-200/50 dark:border-blue-700/50">
                    <p className="text-xs font-semibold text-foreground">📚 Sobre o mentorado:</p>
                    
                    {session.mentee_formation && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-xs text-muted-foreground font-medium">Formação:</span>
                        <span className="text-foreground">{session.mentee_formation}</span>
                      </div>
                    )}
                    
                    {session.mentee_objective && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-xs text-muted-foreground font-medium">Objetivo:</span>
                        <span className="text-foreground italic">"{session.mentee_objective}"</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Contact info */}
                <div className="bg-card/50 rounded-lg p-2 space-y-1 border border-border/50">
                  {session.mentee_email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3 text-primary" />
                      <a href={`mailto:${session.mentee_email}`} className="hover:text-primary transition-colors underline">
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

                  {!session.mentee_email && !session.mentee_profile?.phone && (
                    <p className="text-xs text-muted-foreground italic">Contato não disponível</p>
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
                    confirmedByMentor={session.confirmed_by_mentor || false}
                    onUpdate={fetchMentorData}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Disclaimer Modal */}
      <MentorDisclaimerModal
        isOpen={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        onAccept={handleAcceptDisclaimer}
      />
    </motion.div>
  );
};

export default MentorPanel;
