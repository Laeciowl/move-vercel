import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, User, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface MentorSession {
  id: string;
  scheduled_at: string;
  status: string;
  confirmed_by_mentor: boolean;
  user_id: string;
  mentor_notes: string | null;
  duration?: number | null;
  mentee_profile?: {
    name: string;
    phone: string | null;
    photo_url?: string | null;
  };
}

/** Após o horário de término (início + duração), a sessão exige check-in manual do mentor — inclusive se o mentorado reconfirmou presença. */
function isSessionEnded(scheduledAt: string, durationMinutes?: number | null): boolean {
  const end = new Date(scheduledAt);
  end.setMinutes(end.getMinutes() + (durationMinutes ?? 30));
  return end.getTime() < Date.now();
}

interface MentorAttendanceReportProps {
  sessions: MentorSession[];
  mentorId: string;
  onUpdate: () => void;
}

/** UI values → DB: no_show_mentorado + mentee_avisou quando aplicável */
const attendanceOptions = [
  { value: "realizada", label: "Sim, a mentoria aconteceu normalmente", icon: "✅" },
  {
    value: "no_show_mentor",
    label: "Não — eu (mentor) não compareci / não entrei na sessão",
    icon: "😓",
  },
  {
    value: "no_show_mentorado_sem_aviso",
    label: "Não — o mentorado não compareceu (conta como falta)",
    icon: "❌",
  },
  {
    value: "no_show_mentorado_com_aviso",
    label: "Não — o mentorado avisou com antecedência que não poderia comparecer — sem penalidade",
    icon: "📩",
  },
  {
    value: "reagendada",
    label: "Não ocorreu nesta data — combinamos remarcar para outro dia",
    icon: "🔄",
  },
];

type AttendanceChoice = (typeof attendanceOptions)[number]["value"];

const MentorAttendanceReport = ({ sessions, mentorId, onUpdate }: MentorAttendanceReportProps) => {
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [status, setStatus] = useState<AttendanceChoice | "">("");
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportedSessions, setReportedSessions] = useState<Set<string>>(new Set());

  const pastSessions = sessions.filter(
    (s) =>
      (s.status === "completed" || (s.status === "scheduled" && s.confirmed_by_mentor)) &&
      isSessionEnded(s.scheduled_at, s.duration) &&
      !reportedSessions.has(s.id)
  );

  useEffect(() => {
    fetchReportedSessions();
  }, [sessions]);

  const fetchReportedSessions = async () => {
    const sessionIds = sessions
      .filter((s) => isSessionEnded(s.scheduled_at, s.duration))
      .map((s) => s.id);
    
    if (sessionIds.length === 0) return;

    const { data } = await supabase
      .from("mentee_attendance")
      .select("session_id")
      .in("session_id", sessionIds);

    if (data) {
      setReportedSessions(new Set(data.map(d => d.session_id)));
    }
  };

  const unreportedPastSessions = pastSessions.filter(s => !reportedSessions.has(s.id));

  const handleSubmit = async (sessionId: string) => {
    if (!status) return;
    setSubmitting(true);

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dbStatus =
      status === "no_show_mentorado_sem_aviso" || status === "no_show_mentorado_com_aviso"
        ? "no_show_mentorado"
        : status;

    const { error: attendanceError } = await supabase
      .from("mentee_attendance")
      .insert({
        session_id: sessionId,
        mentor_id: mentorId,
        mentee_user_id: session.user_id,
        status: dbStatus as any,
        mentee_avisou:
          status === "no_show_mentorado_sem_aviso"
            ? false
            : status === "no_show_mentorado_com_aviso"
              ? true
              : status === "reagendada"
                ? true
                : false,
        mentor_observations: observations.trim() || null,
        reported_by: user.id,
      });

    if (attendanceError) {
      if (attendanceError.code === "23505") {
        toast.error("Comparecimento já registrado para esta sessão");
      } else {
        toast.error("Erro ao registrar: " + attendanceError.message);
      }
      setSubmitting(false);
      return;
    }

    if (status === "realizada" && session.status !== "completed") {
      await supabase
        .from("mentor_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId);
    } else if (status === "no_show_mentor") {
      await supabase
        .from("mentor_sessions")
        .update({
          status: "cancelled",
          mentor_notes:
            "Não realizada: mentor não compareceu" + (observations.trim() ? ` — ${observations.trim()}` : ""),
        })
        .eq("id", sessionId);
    } else if (status === "no_show_mentorado_sem_aviso") {
      await supabase
        .from("mentor_sessions")
        .update({
          status: "cancelled",
          mentor_notes:
            "Não realizada: mentorado não compareceu" +
            (observations.trim() ? ` — ${observations.trim()}` : ""),
        })
        .eq("id", sessionId);
    } else if (status === "no_show_mentorado_com_aviso") {
      await supabase
        .from("mentor_sessions")
        .update({
          status: "cancelled",
          mentor_notes:
            "Não realizada: mentorado não apareceu (avisou com antecedência — sem penalidade)" +
            (observations.trim() ? ` — ${observations.trim()}` : ""),
        })
        .eq("id", sessionId);
    } else if (status === "reagendada") {
      await supabase
        .from("mentor_sessions")
        .update({
          status: "cancelled",
          mentor_notes:
            "Não realizada nesta data: combinado reagendar" + (observations.trim() ? ` — ${observations.trim()}` : ""),
        })
        .eq("id", sessionId);
    }

    toast.success("Comparecimento registrado com sucesso! ✅");
    setReportingId(null);
    setStatus("");
    setReportedSessions(prev => new Set([...prev, sessionId]));
    onUpdate();
    setSubmitting(false);
  };

  if (unreportedPastSessions.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-primary" />
        Confirmar comparecimento ({unreportedPastSessions.length})
      </h4>

      <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5">
        Quem não reconfirma presença perde o horário (sessão cancelada automaticamente). As mentorias que aparecem aqui já passaram por essa etapa.
        Mesmo assim, <strong className="text-foreground font-medium">após o horário agendado</strong> é obrigatório registrar manualmente se a sessão ocorreu
        — esse é o check do mentor.
      </p>

      <div className="space-y-3">
        {unreportedPastSessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/30 shrink-0">
                {session.mentee_profile?.photo_url ? (
                  <img src={session.mentee_profile.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary/60" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="font-medium text-foreground block text-sm">
                  {session.mentee_profile?.name || "Mentorado"}
                </span>
                <span className="text-xs text-muted-foreground block">
                  📅 {format(new Date(session.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {session.duration != null && session.duration > 0 ? ` · ${session.duration} min` : ""}
                </span>
              </div>
            </div>

            {reportingId !== session.id ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReportingId(session.id)}
                className="w-full gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                Reportar comparecimento
              </Button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-background/80 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Esta mentoria aconteceu?
                    </p>
                    <RadioGroup
                      value={status}
                      onValueChange={(v) => setStatus(v as AttendanceChoice)}
                      className="space-y-2"
                    >
                      {attendanceOptions.map((option) => (
                        <div key={option.value} className="flex items-start gap-2.5">
                          <RadioGroupItem value={option.value} id={`att-${session.id}-${option.value}`} className="mt-1" />
                          <Label htmlFor={`att-${session.id}-${option.value}`} className="text-sm cursor-pointer leading-snug">
                            {option.icon} {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {status === "no_show_mentorado_sem_aviso" && (
                    <p className="text-xs text-destructive flex items-start gap-2 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      Registra falta do mentorado e pode aplicar penalidade. Use a opção com aviso prévio só se ele avisou <em>antes</em> da sessão que não poderia comparecer.
                    </p>
                  )}

                  {status === "no_show_mentorado_com_aviso" && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                      O mentorado não recebe penalidade por no-show quando houve aviso prévio.
                    </p>
                  )}

                  {status && (
                    <Textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value.slice(0, 500))}
                      placeholder="Observações (opcional)..."
                      rows={2}
                      className="resize-none text-sm"
                    />
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReportingId(null);
                        setStatus("");
                        setObservations("");
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(session.id)}
                      disabled={!status || submitting}
                      className="flex-1 bg-primary text-primary-foreground"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmar
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MentorAttendanceReport;
