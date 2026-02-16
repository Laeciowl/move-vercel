import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Global handler for Google Calendar OAuth callback.
 * Detects ?code=...&state=... in the URL and exchanges the code for tokens.
 * Must be mounted at the app level so it works regardless of which modal is open.
 */
const GoogleCalendarCallbackHandler = () => {
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const stateParam = params.get("state");

    // Only handle if both code and state are present (Google OAuth callback)
    if (!code || !stateParam) return;

    // Prevent double execution
    handledRef.current = true;

    const exchangeCode = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error("GoogleCalendarCallback: No auth session");
          return;
        }

        let stateData: { redirect_uri: string };
        try {
          stateData = JSON.parse(atob(stateParam));
        } catch {
          console.error("GoogleCalendarCallback: Invalid state param");
          return;
        }

        console.log("GoogleCalendarCallback: Exchanging code for tokens...");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=exchange-code`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              redirect_uri: stateData.redirect_uri,
            }),
          }
        );

        const data = await response.json();
        console.log("GoogleCalendarCallback: Response:", data);

        if (data.success) {
          toast.success(`✅ Google Calendar conectado! (${data.google_email || ""})`);
        } else {
          toast.error("Erro ao conectar Google Calendar: " + (data.error || "Tente novamente"));
        }
      } catch (e) {
        console.error("GoogleCalendarCallback: Error:", e);
        toast.error("Erro ao conectar Google Calendar");
      } finally {
        // Clean URL params regardless of success/failure
        window.history.replaceState({}, "", window.location.pathname);
      }
    };

    exchangeCode();
  }, []);

  return null;
};

export default GoogleCalendarCallbackHandler;
