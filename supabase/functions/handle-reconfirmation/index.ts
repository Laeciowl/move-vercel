import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "check" | "confirm" | "cancel";

interface RequestBody {
  sessionId: string;
  action: Action;
}

async function notifyMentor(
  adminClient: ReturnType<typeof createClient>,
  session: Record<string, unknown>
): Promise<void> {
  if (!RESEND_API_KEY) return;

  const mentorEmail = (session.mentors as Record<string, string> | null)?.email;
  const mentorName = (session.mentors as Record<string, string> | null)?.name || "Mentor";
  if (!mentorEmail) return;

  const { data: menteeProfile } = await adminClient
    .from("profiles")
    .select("name")
    .eq("user_id", session.user_id as string)
    .maybeSingle();
  const menteeName = (menteeProfile as { name?: string } | null)?.name || "Mentorado";

  const scheduledAt = new Date(session.scheduled_at as string);
  const sessionTime = scheduledAt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const MOVE_COLORS = { primary: "#f97316", success: "#22c55e", text: "#1e293b", textMuted: "#64748b" };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
      <h1 style="color: ${MOVE_COLORS.success}; text-align: center;">✅ Presença confirmada!</h1>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">Olá, ${mentorName}!</p>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
        O mentorado <strong style="color: ${MOVE_COLORS.primary};">${menteeName}</strong>
        confirmou presença para a mentoria de hoje às <strong>${sessionTime}</strong>.
      </p>
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 12px; margin: 15px 0; border-left: 4px solid ${MOVE_COLORS.success};">
        <p style="color: ${MOVE_COLORS.text}; margin: 0;">A sessão está confirmada! Prepare-se para a mentoria. 🎯</p>
      </div>
      <div style="text-align: center; margin-top: 25px;">
        <a href="https://movecarreiras.org/agenda"
           style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
          Ver Agenda
        </a>
      </div>
      <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; text-align: center; margin-top: 30px;">
        <strong style="color: ${MOVE_COLORS.primary};">Movê</strong> — educação que Move
      </p>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Movê <noreply@movecarreiras.org>",
      to: [mentorEmail],
      subject: "✅ Mentorado confirmou presença na mentoria",
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  try {
    const { sessionId, action }: RequestBody = await req.json();

    if (!sessionId || !action) {
      return json({ error: "sessionId and action are required" }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch session (always with service role — no RLS restrictions)
    const { data: session, error: fetchError } = await adminClient
      .from("mentor_sessions")
      .select("id, scheduled_at, status, reconfirmation_confirmed, user_id, mentor_id, mentors:mentor_id(name, email)")
      .eq("id", sessionId)
      .maybeSingle();

    if (fetchError || !session) {
      return json({ error: "Session not found" }, 404);
    }

    // Build session info for the UI
    const mentorName = (session.mentors as Record<string, string> | null)?.name || "Mentor";
    const sessionInfo = {
      mentorName,
      date: new Date(session.scheduled_at as string).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      }),
    };

    // "check" only returns session state without mutating anything
    if (action === "check") {
      return json({
        status: session.status,
        reconfirmation_confirmed: session.reconfirmation_confirmed,
        sessionInfo,
      });
    }

    // Guard: only act on scheduled sessions with no prior reconfirmation response
    if (session.status !== "scheduled") {
      return json({ result: "already_done", sessionInfo });
    }
    if (session.reconfirmation_confirmed !== null) {
      return json({ result: "already_done", sessionInfo });
    }

    const now = new Date().toISOString();

    if (action === "confirm") {
      const scheduledAt = new Date(session.scheduled_at as string);
      const minutesUntil = (scheduledAt.getTime() - Date.now()) / 60_000;
      // Alinhado ao e-mail e ao auto-cancel: confirmar só com mais de 3h até o início
      if (minutesUntil <= 180) {
        return json({
          result: "deadline_expired",
          message:
            "O prazo para confirmar presença (até 3 horas antes da mentoria) já encerrou. Se a sessão foi cancelada automaticamente, você pode agendar outra.",
          sessionInfo,
        });
      }

      await adminClient
        .from("mentor_sessions")
        .update({
          reconfirmation_confirmed: true,
          reconfirmation_confirmed_at: now,
        })
        .eq("id", sessionId);

      // Fire-and-forget: notify mentor
      notifyMentor(adminClient, session as Record<string, unknown>).catch((e) =>
        console.error("Error notifying mentor:", e)
      );

      return json({ result: "confirmed", sessionInfo });
    }

    if (action === "cancel") {
      await adminClient
        .from("mentor_sessions")
        .update({
          reconfirmation_confirmed: false,
          reconfirmation_confirmed_at: now,
          status: "cancelled",
          mentor_notes: "Cancelada pelo mentorado via reconfirmação",
        })
        .eq("id", sessionId);

      return json({ result: "cancelled", sessionInfo });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in handle-reconfirmation:", message);
    return json({ error: message }, 500);
  }
});
