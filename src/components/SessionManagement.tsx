import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X, Loader2, RefreshCw, MessageSquare, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import RescheduleWithAvailability from "./RescheduleWithAvailability";

interface SessionManagementProps {
  sessionId: string;
  scheduledAt: string;
  mentorName: string;
  mentorId: string;
  menteeName?: string;
  menteeEmail?: string;
  mentorEmail?: string;
  userRole: "mentor" | "mentee";
  confirmedByMentor?: boolean;
  isPastSession?: boolean;
  onUpdate: () => void;
  onConfirmCompletion?: () => void;
}

const SessionManagement = ({
  sessionId,
  scheduledAt,
  mentorName,
  mentorId,
  menteeName,
  menteeEmail,
  mentorEmail,
  userRole,
  confirmedByMentor = false,
  isPastSession = false,
  onUpdate,
  onConfirmCompletion,
}: SessionManagementProps) => {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"cancel" | "reschedule">("cancel");
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionDate = new Date(scheduledAt);
  const formattedDate = format(sessionDate, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });

  const handleCancel = async () => {
    setLoading(true);

    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        status: "cancelled",
        mentor_notes: reason || `Cancelado pelo ${userRole === "mentor" ? "mentor" : "mentorado"}`,
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao cancelar sessão: " + error.message);
      setLoading(false);
      return;
    }

    // Send cancellation emails
    const recipientEmail = userRole === "mentor" ? menteeEmail : mentorEmail;
    const recipientName = userRole === "mentor" ? menteeName : mentorName;
    const cancelledBy = userRole === "mentor" ? mentorName : menteeName;

    if (recipientEmail) {
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: recipientEmail,
            name: recipientName || "Usuário",
            type: "session_cancelled_notification",
            data: {
              date: formattedDate,
              cancelledBy: cancelledBy || "O participante",
              reason: reason || "Não informado",
              userRole: userRole,
            },
          },
        });
      } catch (err) {
        console.error("Error sending cancellation email:", err);
      }
    }

    toast.success("Sessão cancelada com sucesso");
    setShowModal(false);
    setReason("");
    onUpdate();
    setLoading(false);
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error("Selecione a nova data e horário");
      return;
    }

    setLoading(true);

    const newScheduledAt = new Date(`${newDate}T${newTime}:00`);
    const newFormattedDate = format(newScheduledAt, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });

    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        scheduled_at: newScheduledAt.toISOString(),
        confirmed_by_mentor: false,
        mentor_notes: reason || `Remarcado pelo ${userRole === "mentor" ? "mentor" : "mentorado"}`,
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao remarcar sessão: " + error.message);
      setLoading(false);
      return;
    }

    // Send reschedule emails
    const recipientEmail = userRole === "mentor" ? menteeEmail : mentorEmail;
    const recipientName = userRole === "mentor" ? menteeName : mentorName;
    const rescheduledBy = userRole === "mentor" ? mentorName : menteeName;

    if (recipientEmail) {
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: recipientEmail,
            name: recipientName || "Usuário",
            type: "session_rescheduled",
            data: {
              oldDate: formattedDate,
              newDate: newFormattedDate,
              rescheduledBy: rescheduledBy || "O participante",
              reason: reason || "Não informado",
              userRole: userRole,
            },
          },
        });
      } catch (err) {
        console.error("Error sending reschedule email:", err);
      }
    }

    toast.success("Sessão remarcada com sucesso");
    setShowModal(false);
    setReason("");
    setNewDate("");
    setNewTime("");
    onUpdate();
    setLoading(false);
  };

  const openModal = (actionType: "cancel" | "reschedule") => {
    setAction(actionType);
    setShowModal(true);
  };

  // Calculate minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  // Mentees can only reschedule if the session is confirmed by mentor
  const canReschedule = userRole === "mentor" || confirmedByMentor;

  return (
    <>
      <div className="flex gap-2">
        {isPastSession ? (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => onConfirmCompletion?.()}
              className="text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Confirmar Realização
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal("cancel")}
              className="text-xs text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <X className="w-3 h-3 mr-1" />
              Não realizada
            </Button>
          </>
        ) : (
          <>
            {canReschedule ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal("reschedule")}
                className="text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Remarcar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-xs opacity-50 cursor-not-allowed"
                title="Aguarde a confirmação do mentor para remarcar"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Remarcar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal("cancel")}
              className="text-xs text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <X className="w-3 h-3 mr-1" />
              Cancelar
            </Button>
          </>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-4 right-4 top-[5%] bottom-[5%] md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-lg md:w-full md:top-[5%] md:bottom-auto md:max-h-[90vh] bg-card rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border shrink-0">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {action === "cancel" ? (
                    <>
                      <X className="w-5 h-5 text-destructive" />
                      Cancelar sessão
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5 text-primary" />
                      Remarcar sessão
                    </>
                  )}
                </h3>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {action === "cancel" ? (
                  <>
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-foreground font-medium">
                        {userRole === "mentor" ? menteeName : mentorName}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formattedDate}
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Motivo (opcional)
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                        placeholder="Ex: Tive um imprevisto..."
                        maxLength={500}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowModal(false)}
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleCancel}
                        disabled={loading}
                        variant="destructive"
                        className="flex-1"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Confirmar cancelamento"
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <RescheduleWithAvailability
                    sessionId={sessionId}
                    scheduledAt={scheduledAt}
                    mentorName={mentorName}
                    mentorId={mentorId}
                    menteeName={menteeName}
                    menteeEmail={menteeEmail}
                    mentorEmail={mentorEmail}
                    userRole={userRole}
                    onUpdate={onUpdate}
                    onClose={() => setShowModal(false)}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SessionManagement;
