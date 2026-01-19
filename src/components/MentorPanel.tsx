import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Calendar, Clock, Settings, Shield, Loader2, Phone, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import MentorBlockedPeriodsManager from "./MentorBlockedPeriodsManager";
import MentorDisclaimerModal from "./MentorDisclaimerModal";
import MentorSessionConfirmation from "./MentorSessionConfirmation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
interface Availability {
  day: string;
  times: string[];
}

interface MentorData {
  id: string;
  name: string;
  email: string;
  area: string;
  description: string;
  status: string;
  availability: Availability[];
  disclaimer_accepted: boolean;
  disclaimer_accepted_at: string | null;
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
    email?: string;
    phone: string | null;
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
        availability: (mentor.availability as unknown as Availability[]) || [],
      });

      // Fetch upcoming sessions with mentee info
      const { data: sessionsData } = await supabase
        .from("mentor_sessions")
        .select("*")
        .eq("mentor_id", mentor.id)
        .order("scheduled_at", { ascending: true });

      if (sessionsData) {
        // Fetch mentee profiles with email
        const userIds = sessionsData.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, name, phone, email:user_id")
          .in("user_id", userIds);
        
        // Fetch emails from auth (via profiles table join not possible, use stored email)
        // We'll need to get emails from the profiles or use a workaround
        // For now, let's fetch from auth.users via a function or use the user_id

        const sessionsWithProfiles = sessionsData.map(session => ({
          ...session,
          mentee_profile: profiles?.find(p => p.user_id === session.user_id),
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
            <p className="text-sm text-muted-foreground">{mentorData.area}</p>
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

      {/* Availability summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Sua disponibilidade
        </h4>
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
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Blocked periods toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
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

      {/* Session Confirmation */}
      <MentorSessionConfirmation sessions={sessions} onUpdate={fetchMentorData} />

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
            {upcomingSessions.slice(0, 3).map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-gradient-to-br from-accent/50 to-accent/30 rounded-2xl p-4 space-y-2 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-soft"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {session.mentee_profile?.name || "Mentorado"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  📅 {formatSessionDate(session.scheduled_at)}
                </p>
                {session.mentee_profile?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{session.mentee_profile.phone}</span>
                  </div>
                )}
                <p className="text-xs text-primary">
                  💡 Lembre-se de entrar em contato para confirmar a sessão!
                </p>
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
