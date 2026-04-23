import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GoogleCalendarConnectionStatus = {
  connected: boolean;
  google_email: string | null;
  connected_at: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

/**
 * Same source of truth as GoogleCalendarSettings: edge function google-calendar-auth?action=status
 */
export function useGoogleCalendarConnectionStatus(): GoogleCalendarConnectionStatus {
  const [connected, setConnected] = useState(false);
  const [google_email, setGoogleEmail] = useState<string | null>(null);
  const [connected_at, setConnectedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data: refreshed } = await supabase.auth.refreshSession();
      const session = refreshed.session ?? (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) {
        setConnected(false);
        setGoogleEmail(null);
        setConnectedAt(null);
        return;
      }

      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=status`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            ...(publishableKey ? { apikey: publishableKey } : {}),
          },
        }
      );
      const data = await response.json().catch(() => ({}));
      if (data.connected !== undefined) {
        setConnected(!!data.connected);
        setGoogleEmail(data.google_email ?? null);
        setConnectedAt(data.connected_at ?? null);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
      setGoogleEmail(null);
      setConnectedAt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return {
    connected,
    google_email,
    connected_at,
    loading,
    refetch: fetchStatus,
  };
}
