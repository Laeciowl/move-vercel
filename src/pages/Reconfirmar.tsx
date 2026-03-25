import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const Reconfirmar = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session");
  const action = searchParams.get("action"); // "confirm" or "cancel"
  const [status, setStatus] = useState<"loading" | "confirming" | "confirmed" | "cancelled" | "error" | "already_done">("loading");
  const [sessionInfo, setSessionInfo] = useState<{ mentorName: string; date: string } | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    checkSession();
  }, [sessionId]);

  const checkSession = async () => {
    const { data: session, error } = await supabase
      .from("mentor_sessions")
      .select("id, scheduled_at, status, reconfirmation_confirmed, mentors:mentor_id(name)")
      .eq("id", sessionId!)
      .maybeSingle();

    if (error || !session) {
      setStatus("error");
      return;
    }

    const mentorData = session.mentors as any;
    setSessionInfo({
      mentorName: mentorData?.name || "Mentor",
      date: new Date(session.scheduled_at).toLocaleDateString("pt-BR", {
        weekday: "long", day: "2-digit", month: "long",
        hour: "2-digit", minute: "2-digit",
      }),
    });

    if (session.status !== "scheduled") {
      setStatus("already_done");
      return;
    }

    if (session.reconfirmation_confirmed !== null) {
      setStatus("already_done");
      return;
    }

    // Auto-execute if action is specified
    if (action === "confirm") {
      setStatus("confirming");
      await handleConfirm();
    } else if (action === "cancel") {
      setStatus("confirming");
      await handleCancel();
    } else {
      setStatus("confirming");
    }
  };

  const handleConfirm = async () => {
    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        reconfirmation_confirmed: true,
        reconfirmation_confirmed_at: new Date().toISOString(),
      })
      .eq("id", sessionId!);

    if (error) {
      setStatus("error");
    } else {
      setStatus("confirmed");
      // Send notification to mentor
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "mentee_reconfirmed",
            data: { sessionId },
          },
        });
      } catch (e) {
        console.error("Error notifying mentor:", e);
      }
    }
  };

  const handleCancel = async () => {
    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        reconfirmation_confirmed: false,
        reconfirmation_confirmed_at: new Date().toISOString(),
        status: "cancelled",
        mentor_notes: "Cancelada pelo mentorado via reconfirmação",
      })
      .eq("id", sessionId!);

    if (error) {
      setStatus("error");
    } else {
      setStatus("cancelled");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl shadow-card border border-border/50 p-8 text-center space-y-6"
        >
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Carregando sessão...</p>
            </>
          )}

          {status === "confirmed" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Presença confirmada! ✅</h2>
              {sessionInfo && (
                <p className="text-sm text-muted-foreground">
                  Mentoria com <strong>{sessionInfo.mentorName}</strong><br />
                  {sessionInfo.date}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Seu mentor foi notificado. Até logo! 🧡
              </p>
              <Button onClick={() => navigate("/inicio")} className="w-full">
                Voltar para a plataforma
              </Button>
            </>
          )}

          {status === "cancelled" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Sessão cancelada</h2>
              {sessionInfo && (
                <p className="text-sm text-muted-foreground">
                  Mentoria com <strong>{sessionInfo.mentorName}</strong><br />
                  {sessionInfo.date}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                O mentor foi notificado e está liberado. Você pode agendar uma nova sessão quando quiser.
              </p>
              <Button onClick={() => navigate("/mentores")} variant="outline" className="w-full">
                Ver mentores disponíveis
              </Button>
            </>
          )}

          {status === "confirming" && !action && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Confirme sua presença</h2>
              {sessionInfo && (
                <p className="text-sm text-muted-foreground">
                  Mentoria com <strong>{sessionInfo.mentorName}</strong><br />
                  {sessionInfo.date}
                </p>
              )}
              <div className="space-y-3">
                <Button onClick={handleConfirm} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  ✅ Confirmar Presença
                </Button>
                <Button onClick={handleCancel} variant="destructive" className="w-full">
                  ❌ Cancelar Sessão
                </Button>
              </div>
            </>
          )}

          {status === "already_done" && (
            <>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Ação já registrada</h2>
              <p className="text-sm text-muted-foreground">
                Esta sessão já foi confirmada ou cancelada anteriormente.
              </p>
              <Button onClick={() => navigate("/inicio")} variant="outline" className="w-full">
                Voltar para a plataforma
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Erro</h2>
              <p className="text-sm text-muted-foreground">
                Não foi possível processar a solicitação. A sessão pode não existir ou já ter sido alterada.
              </p>
              <Button onClick={() => navigate("/inicio")} variant="outline" className="w-full">
                Voltar para a plataforma
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Reconfirmar;
