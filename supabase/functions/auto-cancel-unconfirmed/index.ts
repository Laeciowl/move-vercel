import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MOVE_COLORS = {
  primary: '#f97316',
  text: '#1e293b',
  textMuted: '#64748b',
};

function generateCancellationHtml(name: string, role: "mentor" | "mentee", otherPerson: string, date: string, reason: string): string {
  const ismentee = role === "mentee";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
      <h1 style="color: #dc2626; text-align: center;">❌ Sessão cancelada</h1>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
        Olá, ${name}!
      </p>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
        ${reason}
      </p>
      <div style="background-color: #fef2f2; padding: 15px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #dc2626;">
        <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>${ismentee ? "Mentor" : "Mentorado"}:</strong> ${otherPerson}</p>
        <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Data/Hora:</strong> ${date}</p>
      </div>
      ${role === "mentor" ? `
      <p style="color: ${MOVE_COLORS.text}; font-size: 14px; line-height: 1.6;">
        Você está liberado(a) para este horário. Obrigado por sua disponibilidade! 🧡
      </p>
      ` : `
      <p style="color: ${MOVE_COLORS.text}; font-size: 14px; line-height: 1.6;">
        Esta falta foi registrada no seu histórico. Mentores são voluntários doando tempo — por favor, confirme sua presença nas próximas mentorias.
      </p>
      `}
      <div style="text-align: center; margin-top: 25px;">
        <a href="https://movecarreiras.org/dashboard" 
           style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
          Acessar Plataforma
        </a>
      </div>
      <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; text-align: center; margin-top: 30px;">
        <strong style="color: ${MOVE_COLORS.primary};">Movê</strong> — educação que Move
      </p>
    </div>
  `;
}

function generateMentorWarningHtml(mentorName: string, menteeName: string, date: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
      <h1 style="color: #d97706; text-align: center;">⚠️ Mentorado não reconfirmou</h1>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
        Olá, ${mentorName}!
      </p>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
        O mentorado <strong>${menteeName}</strong> não reconfirmou presença para a mentoria de
        <strong> ${date}</strong>.
      </p>
      <div style="background-color: #fffbeb; padding: 15px; border-radius: 12px; margin: 15px 0; border-left: 4px solid #d97706;">
        <p style="color: ${MOVE_COLORS.text}; margin: 0;">
          A sessão <strong>continua agendada</strong> porque seu cancelamento automático está desativado.
        </p>
      </div>
      <p style="color: ${MOVE_COLORS.text}; font-size: 14px; line-height: 1.6;">
        Se quiser, você pode ativar o cancelamento automático em <strong>Minha Agenda</strong>.
      </p>
      <div style="text-align: center; margin-top: 25px;">
        <a href="https://movecarreiras.org/mentor/agenda"
           style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
          Abrir Minha Agenda
        </a>
      </div>
      <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; text-align: center; margin-top: 30px;">
        <strong style="color: ${MOVE_COLORS.primary};">Movê</strong> — educação que Move
      </p>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Movê <noreply@movecarreiras.org>",
        to: [to],
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();

    // Find sessions where:
    // - Reconfirmation was sent
    // - No reconfirmation response received (reconfirmation_confirmed IS NULL)
    // - Session start está entre 2h e 3h no futuro (janela de 1h para o cron */30 pegar uma vez)
    //
    // Importante: handle-reconfirmation só aceita confirmar com minutesUntil > 180 (estritamente mais de 3h).
    // A janela antiga [2,5h, 3,5h] cancelava por volta de 14:30 para sessão 18h — ainda dava para confirmar até ~15h.
    // Com [2h, 3h], só entram sessões com 2h–3h até o início, ou seja, depois que o prazo de confirmação já fechou.
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const in3h = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();

    const { data: rawSessions } = await adminClient
      .from("mentor_sessions")
      .select("*, mentors(name, email, auto_cancel_no_reconfirmation)")
      .eq("status", "scheduled")
      .eq("confirmed_by_mentor", true)
      .eq("reconfirmation_sent", true)
      .is("reconfirmation_confirmed", null)
      .gte("scheduled_at", in2h)
      .lte("scheduled_at", in3h);

    // Período de graça após o envio do e-mail (evita corrida se o envio atrasar e cair no mesmo tick).
    const GRACE_MS = 45 * 60 * 1000;
    const nowMs = Date.now();
    const sessions = (rawSessions || []).filter((session) => {
      if (!session.reconfirmation_sent_at) return true;
      const sentAt = new Date(session.reconfirmation_sent_at as string).getTime();
      return nowMs - sentAt >= GRACE_MS;
    });

    let cancelledCount = 0;

    if (sessions.length > 0) {
      for (const session of sessions) {
        const scheduledAt = new Date(session.scheduled_at);
        const minutesUntil = (scheduledAt.getTime() - Date.now()) / 60_000;
        // Mesmo critério do handle-reconfirmation: só cancelar se já não for possível confirmar.
        if (minutesUntil > 180) continue;

        const mentorName = (session.mentors as any)?.name || "Mentor";
        const mentorEmail = (session.mentors as any)?.email;
        const autoCancelEnabled = Boolean((session.mentors as any)?.auto_cancel_no_reconfirmation);
        const dateStr = scheduledAt.toLocaleDateString('pt-BR', {
          weekday: 'long', day: '2-digit', month: 'long',
          hour: '2-digit', minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });

        // Get mentee info
        const { data: menteeProfile } = await adminClient
          .from("profiles")
          .select("name")
          .eq("user_id", session.user_id)
          .maybeSingle();
        const menteeName = menteeProfile?.name || "Mentorado";

        const { data: menteeUser } = await adminClient.auth.admin.getUserById(session.user_id);
        const menteeEmail = menteeUser?.user?.email;

        if (autoCancelEnabled) {
          // Cancel the session when mentor opted-in.
          await adminClient
            .from("mentor_sessions")
            .update({
              status: "cancelled",
              reconfirmation_confirmed: false,
              reconfirmation_confirmed_at: new Date().toISOString(),
              mentor_notes: "Cancelada automaticamente: mentorado não confirmou presença (deadline 3h antes)",
            })
            .eq("id", session.id);

          // Record as no-show
          try {
            await adminClient
              .from("mentee_attendance")
              .insert({
                session_id: session.id,
                mentor_id: session.mentor_id,
                mentee_user_id: session.user_id,
                status: "no_show_mentorado",
                mentee_avisou: false,
                mentor_observations: "Cancelamento automático: não confirmou presença 3h antes",
                reported_by: session.user_id, // system report
              });
          } catch (e) {
            console.error("Error recording no-show:", e);
          }

          // Notify mentor
          if (mentorEmail) {
            await sendEmail(
              mentorEmail,
              "❌ Mentoria cancelada — mentorado não confirmou presença",
              generateCancellationHtml(
                mentorName,
                "mentor",
                menteeName,
                dateStr,
                `O mentorado ${menteeName} não confirmou presença para a mentoria de hoje. A sessão foi cancelada automaticamente e você está liberado(a) para este horário.`,
              ),
            );
          }

          // Notify mentee
          if (menteeEmail) {
            await sendEmail(
              menteeEmail,
              "❌ Sua sessão de mentoria foi cancelada",
              generateCancellationHtml(
                menteeName,
                "mentee",
                mentorName,
                dateStr,
                `Sua sessão de mentoria foi cancelada porque você não confirmou presença a tempo. O mentor foi liberado.`,
              ),
            );
          }

          cancelledCount++;
        } else {
          // Keep session and notify mentor only once.
          await adminClient
            .from("mentor_sessions")
            .update({
              reconfirmation_confirmed: false,
              reconfirmation_confirmed_at: new Date().toISOString(),
              mentor_notes: "Aviso enviado: mentorado não reconfirmou presença até 3h antes (sessão mantida).",
            })
            .eq("id", session.id);

          if (mentorEmail) {
            await sendEmail(
              mentorEmail,
              "⚠️ Aviso: mentorado não reconfirmou presença",
              generateMentorWarningHtml(mentorName, menteeName, dateStr),
            );
          }
        }
      }
    }

    console.log(
      `Auto-cancel: ${cancelledCount} sessions cancelled out of ${sessions.length} eligible (${rawSessions?.length || 0} in time window before grace filter)`,
    );

    return new Response(
      JSON.stringify({ success: true, cancelled: cancelledCount }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in auto-cancel-unconfirmed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
