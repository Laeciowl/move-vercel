import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Calendar, User, MessageSquare, Mail, Phone, Info, GraduationCap, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WhatsAppTemplates from "./WhatsAppTemplates";

interface MentorSession {
  id: string;
  scheduled_at: string;
  status: string;
  confirmed_by_mentor: boolean;
  mentor_notes: string | null;
  duration?: number;
  mentee_email?: string;
  mentee_formation?: string | null;
  mentee_objective?: string | null;
  mentee_profile?: {
    name: string;
    phone: string | null;
    photo_url?: string | null;
  };
}

interface MentorSessionConfirmationProps {
  sessions: MentorSession[];
  mentorName: string;
  mentorEmail: string;
  onUpdate: () => void;
}

const MentorSessionConfirmation = ({ sessions, mentorName, mentorEmail, onUpdate }: MentorSessionConfirmationProps) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<{ sessionId: string; notes: string } | null>(null);

  // Sessions awaiting initial confirmation (before session time)
  const pendingSessions = sessions.filter(
    s => s.status === "scheduled" && 
    !s.confirmed_by_mentor && 
    new Date(s.scheduled_at) > new Date()
  );

  const sendConfirmationEmails = async (session: MentorSession) => {
    const sessionDate = format(new Date(session.scheduled_at), "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });
    
    // Send email to mentee
    if (session.mentee_email) {
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: session.mentee_email,
            name: session.mentee_profile?.name || "Mentorado",
            type: "session_confirmed",
            data: {
              mentorName: mentorName,
              date: sessionDate,
            },
          },
        });
        console.log("Email sent to mentee:", session.mentee_email);
      } catch (err) {
        console.error("Error sending email to mentee:", err);
      }
    }

    // Send email to mentor
    try {
      await supabase.functions.invoke("send-notification-email", {
        body: {
          to: mentorEmail,
          name: mentorName,
          type: "session_confirmed_mentor",
          data: {
            menteeName: session.mentee_profile?.name || "Mentorado",
            menteeEmail: session.mentee_email || "",
            menteePhone: session.mentee_profile?.phone || "",
            date: sessionDate,
          },
        },
      });
      console.log("Email sent to mentor:", mentorEmail);
    } catch (err) {
      console.error("Error sending email to mentor:", err);
    }
  };

  const confirmSession = async (sessionId: string, confirmed: boolean, notes?: string) => {
    setUpdating(sessionId);
    
    const session = sessions.find(s => s.id === sessionId);
    
    const updateData: Record<string, unknown> = {
      confirmed_by_mentor: confirmed,
      confirmed_at: new Date().toISOString(),
    };
    
    if (!confirmed) {
      updateData.status = "cancelled";
    }
    
    if (notes) {
      updateData.mentor_notes = notes;
    }

    const { error } = await supabase
      .from("mentor_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao atualizar sessão: " + error.message);
    } else {
      toast.success(confirmed ? "Sessão confirmada!" : "Sessão cancelada");
      
      // Send confirmation emails if confirmed
      if (confirmed && session) {
        await sendConfirmationEmails(session);
      }
      
      onUpdate();
    }
    
    setUpdating(null);
    setNotesModal(null);
  };

  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  if (pendingSessions.length === 0) {
    return null;
  }

  return (
    <div id="mentor-sessions" className="space-y-4">
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary" />
        Sessões aguardando confirmação ({pendingSessions.length})
      </h4>
      
      <div className="space-y-3">
        {pendingSessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              {/* Mentee photo */}
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
              <div>
                <span className="font-medium text-foreground block">
                  {session.mentee_profile?.name || "Mentorado"}
                </span>
                <span className="text-xs text-muted-foreground">
                  📅 {formatSessionDate(session.scheduled_at)}
                </span>
              </div>
            </div>
            
            {/* Contact information */}
            <div className="bg-white/80 dark:bg-black/20 rounded-lg p-3 space-y-2 border border-primary/20">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Info className="w-3 h-3 text-primary" />
                Dados de contato do mentorado:
              </p>
              
              {session.mentee_email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  <a href={`mailto:${session.mentee_email}`} className="hover:text-primary transition-colors underline">
                    {session.mentee_email}
                  </a>
                </div>
              )}
              
              {session.mentee_profile?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <a href={`tel:${session.mentee_profile.phone}`} className="hover:text-primary transition-colors">
                    {session.mentee_profile.phone}
                  </a>
                </div>
              )}
              
              {!session.mentee_email && !session.mentee_profile?.phone && (
                <p className="text-xs text-muted-foreground italic">
                  Nenhum contato disponível
                </p>
              )}
            </div>

            {/* Formation and Objective */}
            {(session.mentee_formation || session.mentee_objective) && (
              <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-lg p-3 space-y-3 border border-blue-200/50 dark:border-blue-700/50">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                  📚 Sobre o mentorado:
                </p>
                
                {session.mentee_formation && (
                  <div className="flex items-start gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">Formação:</span>
                      <p className="text-foreground">{session.mentee_formation}</p>
                    </div>
                  </div>
                )}
                
                {session.mentee_objective && (
                  <div className="flex items-start gap-2 text-sm">
                    <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground font-medium">Objetivo da mentoria:</span>
                      <p className="text-foreground italic">"{session.mentee_objective}"</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Templates */}
            {session.confirmed_by_mentor && (
              <WhatsAppTemplates
                menteeName={session.mentee_profile?.name || "Mentorado"}
                menteePhone={session.mentee_profile?.phone || null}
                scheduledAt={session.scheduled_at}
                duration={session.duration || 30}
                objective={session.mentee_objective || null}
              />
            )}

            {/* Disclaimer */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">📌 Importante:</p>
              <p>• A sessão pode ser realizada por Google Meet, Zoom ou qualquer plataforma de sua escolha.</p>
              <p>• Entre em contato e confirme a sessão com o mentorado até <strong>24h antes</strong> do horário agendado.</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => confirmSession(session.id, true)}
                disabled={updating === session.id}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {updating === session.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
              
              <button
                onClick={() => setNotesModal({ sessionId: session.id, notes: "" })}
                disabled={updating === session.id}
                className="flex items-center justify-center gap-2 border border-red-300 text-red-600 py-2 px-4 rounded-lg font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cancel Modal with Notes */}
      <AnimatePresence>
        {notesModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotesModal(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-4 right-4 top-1/4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-md md:w-full bg-card rounded-2xl shadow-xl z-50 p-6"
            >
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Cancelar sessão
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                Se desejar, deixe uma mensagem explicando o motivo do cancelamento (opcional).
              </p>
              
              <textarea
                value={notesModal.notes}
                onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] mb-4"
                placeholder="Ex: Tive um imprevisto no trabalho..."
                maxLength={500}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setNotesModal(null)}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-muted transition-colors font-medium"
                >
                  Voltar
                </button>
                <button
                  onClick={() => confirmSession(notesModal.sessionId, false, notesModal.notes)}
                  disabled={updating === notesModal.sessionId}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  {updating === notesModal.sessionId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirmar cancelamento"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorSessionConfirmation;