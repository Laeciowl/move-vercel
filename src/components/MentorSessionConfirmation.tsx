import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Calendar, User, MessageSquare, Mail, Phone, Info, GraduationCap, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import WhatsAppTemplates from "./WhatsAppTemplates";
import MenteeAttendanceBadge from "./MenteeAttendanceBadge";

interface MentorSession {
  id: string;
  scheduled_at: string;
  status: string;
  confirmed_by_mentor: boolean;
  mentor_notes: string | null;
  duration?: number;
  user_id?: string;
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

  const sendConfirmationEmails = async (session: MentorSession, meetingLink: string | null = null) => {
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
              meetingLink: meetingLink || "",
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
            meetingLink: meetingLink || "",
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
      
      // Create Google Calendar events FIRST, then send emails with the meeting link
      if (confirmed && session) {
        let meetingLink: string | null = null;
        
        // Create Google Calendar events for both mentor and mentee
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const { data: { session: authSession } } = await supabase.auth.getSession();
          const token = authSession?.access_token;
          
          const calResponse = await fetch(`${supabaseUrl}/functions/v1/google-calendar-sync?action=create-event`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const calResult = await calResponse.json();
          console.log("Google Calendar sync result:", calResult);
          
          if (calResult?.results?.meetingLink) {
            meetingLink = calResult.results.meetingLink;
            toast.success("Link do Google Meet criado automaticamente! 🎥");
          }
        } catch (calErr) {
          console.error("Error creating Google Calendar events:", calErr);
        }

        // Now send emails WITH the meeting link if available
        await sendConfirmationEmails(session, meetingLink);
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
                  <span>{session.mentee_profile.phone}</span>
                </div>
              )}
              
              {!session.mentee_email && !session.mentee_profile?.phone && (
                <p className="text-xs text-muted-foreground italic">
                  Nenhum contato disponível
                </p>
              )}
            </div>

            {/* WhatsApp contact button - before accepting */}
            {session.mentee_profile?.phone && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Caso precise falar com o mentorado antes de aceitar a mentoria, entre em contato pelo WhatsApp:
                </p>
                <a
                  href={(() => {
                    const phone = session.mentee_profile!.phone!.replace(/\D/g, "");
                    const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
                    const menteeName = session.mentee_profile?.name || "Mentorado";
                    const objective = session.mentee_objective ? ` sobre "${session.mentee_objective}"` : "";
                    const message = encodeURIComponent(`Olá ${menteeName}! Sou ${mentorName}, seu mentor na plataforma Movê! Recebi seu pedido de mentoria${objective}. Gostaria de conversar um pouco antes de confirmarmos a sessão. Podemos?`);
                    return `https://wa.me/${fullPhone}?text=${message}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1da851] text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Conversar no WhatsApp
                </a>
              </div>
            )}

            {/* Attendance History Badge */}
            {session.user_id && (
              <MenteeAttendanceBadge menteeUserId={session.user_id} />
            )}

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