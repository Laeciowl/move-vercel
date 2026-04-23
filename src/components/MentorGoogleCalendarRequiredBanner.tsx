import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useGoogleCalendarConnectionStatus } from "@/hooks/useGoogleCalendarConnectionStatus";

/**
 * Shown on mentor dashboards when Google Calendar is not connected (required to auto-create Meet links).
 */
const MentorGoogleCalendarRequiredBanner = () => {
  const { connected, loading, refetch } = useGoogleCalendarConnectionStatus();
  const navigate = useNavigate();

  if (loading || connected) return null;

  return (
    <Alert className="border-amber-500/40 bg-amber-50/90 dark:bg-amber-950/25 text-foreground [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
      <Video className="h-4 w-4" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">Conecte o Google Calendar</AlertTitle>
      <AlertDescription className="text-amber-900/90 dark:text-amber-100/90 space-y-3">
        <p>
          Para aceitar pedidos de mentoria e gerar o link do Google Meet automaticamente, você precisa conectar sua conta
          Google na seção <strong className="font-semibold">Google Calendar</strong> (no final do formulário ao editar
          o perfil).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="default" className="bg-amber-700 hover:bg-amber-800 text-white" onClick={() => navigate("/inicio?editarPerfil=1")}>
            Abrir perfil e conectar
          </Button>
          <Button type="button" size="sm" variant="outline" className="border-amber-700/40" onClick={() => void refetch()}>
            Já conectei — atualizar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default MentorGoogleCalendarRequiredBanner;
