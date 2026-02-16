import { useState, useEffect, useCallback } from "react";
import { Calendar, CheckCircle, XCircle, Loader2, Unplug, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GoogleCalendarSettings = () => {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    google_email: string | null;
    connected_at: string | null;
  }>({ connected: false, google_email: null, connected_at: null });

  const fetchStatus = useCallback(async () => {
    try {
      // Use refreshSession to ensure we have a fresh, valid token
      const { data: { session } } = await supabase.auth.refreshSession();
      if (!session) {
        // Fallback to cached session
        const { data: { session: cached } } = await supabase.auth.getSession();
        if (!cached) return;
        // Use cached session for the request
        const fallbackResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=status`,
          {
            headers: {
              Authorization: `Bearer ${cached.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.connected !== undefined) {
          setStatus(fallbackData);
        }
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=status`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await response.json();
      if (data.connected !== undefined) {
        setStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch calendar status:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Re-fetch status periodically to detect connection made by global callback handler
  useEffect(() => {
    const interval = setInterval(() => {
      if (!status.connected) fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [status.connected, fetchStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const redirectUri = window.location.origin + window.location.pathname;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=get-auth-url&redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erro ao obter URL de autenticação");
        setConnecting(false);
      }
    } catch (e) {
      toast.error("Erro ao conectar Google Calendar");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=disconnect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Google Calendar desconectado");
        setStatus({ connected: false, google_email: null, connected_at: null });
      }
    } catch (e) {
      toast.error("Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync?action=test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("✅ Evento de teste criado! Verifique seu Google Calendar");
      } else {
        toast.error("Erro: " + (data.error || "Tente novamente"));
      }
    } catch (e) {
      toast.error("Erro ao criar evento de teste");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-border rounded-xl">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold text-foreground">Google Calendar</h3>
      </div>

      {status.connected ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-700 dark:text-green-400 font-medium">Conectado</span>
          </div>
          {status.google_email && (
            <p className="text-sm text-muted-foreground">Conta: {status.google_email}</p>
          )}
          {status.connected_at && (
            <p className="text-xs text-muted-foreground">
              Conectado em: {new Date(status.connected_at).toLocaleDateString("pt-BR")}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Suas mentorias são sincronizadas automaticamente com seu Google Calendar.
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-destructive hover:text-destructive"
            >
              {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Unplug className="w-3.5 h-3.5 mr-1" />}
              Desconectar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <TestTube className="w-3.5 h-3.5 mr-1" />}
              Testar
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Não conectado</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Conecte sua conta Google para sincronizar mentorias automaticamente.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-1">
            <li>✓ Mentorias aparecem no Google Calendar</li>
            <li>✓ Lembretes automáticos do Google</li>
            <li>✓ Evita conflitos de agenda</li>
          </ul>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-medium">⚠️ Aviso sobre a tela do Google</p>
            <p>
              Ao conectar, o Google pode exibir um aviso de que o app "não foi verificado". 
              Isso é normal — nossa integração está em processo de verificação. 
              <strong>É seguro prosseguir:</strong> clique em "Avançado" e depois em "Acessar" para continuar a conexão.
            </p>
          </div>
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="gap-2"
            style={{ backgroundColor: "#4285F4" }}
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity="0.8"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity="0.6"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity="0.9"/>
              </svg>
            )}
            Conectar Google Calendar
          </Button>
        </>
      )}
    </div>
  );
};

export default GoogleCalendarSettings;
