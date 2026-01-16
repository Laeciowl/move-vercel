import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Clock, Settings, Shield, Loader2, Mail, Phone, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import MentorBlockedPeriodsManager from "./MentorBlockedPeriodsManager";
import MentorDisclaimerModal from "./MentorDisclaimerModal";
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
  mentee_profile?: {
    name: string;
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
      className="bg-card rounded-2xl shadow-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Painel do Mentor</h3>
            <p className="text-sm text-muted-foreground">{mentorData.area}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            mentorData.status === "approved"
              ? "bg-green-100 text-green-700"
              : mentorData.status === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {statusLabels[mentorData.status]}
        </span>
      </div>

      {/* Disclaimer status */}
      {!mentorData.disclaimer_accepted ? (
        <div className="bg-accent/50 rounded-xl p-4 space-y-3">
          <p className="text-sm text-foreground font-medium">
            ⚠️ Para ativar seu perfil de mentor, você precisa aceitar os termos de compromisso.
          </p>
          <button
            onClick={() => setShowDisclaimerModal(true)}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Aceitar termos e ativar perfil
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Termos aceitos em {format(new Date(mentorData.disclaimer_accepted_at!), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
      )}

      {/* Availability summary */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Sua disponibilidade
        </h4>
        <div className="flex flex-wrap gap-2">
          {mentorData.availability.map((avail) => (
            <div
              key={avail.day}
              className="bg-muted px-3 py-1 rounded-lg text-xs text-foreground"
            >
              {dayLabels[avail.day]}: {avail.times.join(", ")}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked periods toggle */}
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
          <div className="space-y-3">
            {upcomingSessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                className="bg-accent/50 rounded-xl p-4 space-y-2"
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
              </div>
            ))}
          </div>
        </div>
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
