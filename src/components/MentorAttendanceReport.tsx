import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, User, Loader2, CheckCircle, XCircle, RefreshCw, AlertTriangle, Calendar } from "lucide-react";
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
  mentee_profile?: {
    name: string;
    phone: string | null;
    photo_url?: string | null;
  };
}

interface MentorAttendanceReportProps {
  sessions: MentorSession[];
  mentorId: string;
  onUpdate: () => void;
}

const attendanceOptions = [
  { value: "realizada", label: "Sim, aconteceu normalmente", icon: "✅" },
  { value: "no_show_mentorado", label: "Não, mentorado NÃO APARECEU", icon: "❌" },
  { value: "no_show_mentor", label: "Não, eu (mentor) não pude comparecer", icon: "😓" },
  { value: "reagendada", label: "Reagendamos para outra data", icon: "🔄" },
];

const MentorAttendanceReport = ({ sessions, mentorId, onUpdate }: MentorAttendanceReportProps) => {
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [menteeAvisou, setMenteeAvisou] = useState<boolean | null>(null);
  const [observations, setObservations] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportedSessions, setReportedSessions] = useState<Set<string>>(new Set());

  // Past completed/scheduled sessions that need attendance reporting
  const pastSessions = sessions.filter(
    s => (s.status === "completed" || (s.status === "scheduled" && s.confirmed_by_mentor)) &&
    new Date(s.scheduled_at) < new Date() &&
    !reportedSessions.has(s.id)
  );

  useEffect(() => {
    fetchReportedSessions();
  }, [sessions]);

  const fetchReportedSessions = async () => {
    const sessionIds = sessions
      .filter(s => new Date(s.scheduled_at) < new Date())
      .map(s => s.id);
    
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

    // Insert attendance record
    const { error: attendanceError } = await supabase
      .from("mentee_attendance")
      .insert({
        session_id: sessionId,
        mentor_id: mentorId,
        mentee_user_id: session.user_id,
        status: status as any,
        mentee_avisou: status === "no_show_mentorado" ? (menteeAvisou ?? false) : false,
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

    // Update session status based on attendance
    if (status === "realizada" && session.status !== "completed") {
      await supabase
        .from("mentor_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId);
    } else if (status === "no_show_mentorado" || status === "no_show_mentor") {
      await supabase
        .from("mentor_sessions")
        .update({
          status: "cancelled",
          mentor_notes: status === "no_show_mentorado"
            ? "Não realizada: mentorado não apareceu" + (observations.trim() ? ` — ${observations.trim()}` : "")
            : "Não realizada: mentor não pôde comparecer" + (observations.trim() ? ` — ${observations.trim()}` : ""),
        })
        .eq("id", sessionId);
    }

    toast.success("Comparecimento registrado com sucesso! ✅");
    setReportingId(null);
    setStatus(null);
    setMenteeAvisou(null);
    setObservations("");
    setReportedSessions(prev => new Set([...prev, sessionId]));
    onUpdate();
    setSubmitting(false);
  };

  if (unreportedPastSessions.length === 0) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-primary" />
        Reportar comparecimento ({unreportedPastSessions.length})
      </h4>

      <div className="space-y-3">
        {unreportedPastSessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/30 shrink-0">
                {session.mentee_profile?.photo_url ? (
                  <img src={session.mentee_profile.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary/60" />
                )}
              </div>
              <div>
                <span className="font-medium text-foreground block text-sm">
                  {session.mentee_profile?.name || "Mentorado"}
                </span>
                <span className="text-xs text-muted-foreground">
                  📅 {format(new Date(session.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                      value={status || ""}
                      onValueChange={setStatus}
                      className="space-y-2"
                    >
                      {attendanceOptions.map((option) => (
                        <div key={option.value} className="flex items-center gap-2.5">
                          <RadioGroupItem value={option.value} id={`att-${session.id}-${option.value}`} />
                          <Label htmlFor={`att-${session.id}-${option.value}`} className="text-sm cursor-pointer">
                            {option.icon} {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Sub-question for no-show */}
                  {status === "no_show_mentorado" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-3"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-foreground">
                          O mentorado avisou com antecedência?
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          variant={menteeAvisou === true ? "default" : "outline"}
                          onClick={() => setMenteeAvisou(true)}
                          className="flex-1"
                        >
                          Sim, avisou
                        </Button>
                        <Button
                          size="sm"
                          variant={menteeAvisou === false ? "destructive" : "outline"}
                          onClick={() => setMenteeAvisou(false)}
                          className="flex-1"
                        >
                          Não, simplesmente não apareceu
                        </Button>
                      </div>
                      {menteeAvisou === false && (
                        <p className="text-xs text-destructive">
                          ⚠️ O mentorado receberá uma penalidade por falta sem aviso.
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Observations */}
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
                        setStatus(null);
                        setMenteeAvisou(null);
                        setObservations("");
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSubmit(session.id)}
                      disabled={
                        !status ||
                        submitting ||
                        (status === "no_show_mentorado" && menteeAvisou === null)
                      }
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
