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
  primaryDark: '#ea580c',
  secondary: '#1e3a5f',
  accent: '#fff7ed',
  text: '#1e293b',
  textMuted: '#64748b',
};

function generateReconfirmationHtml(
  menteeName: string,
  mentorName: string,
  date: string,
  objective: string | null,
  confirmUrl: string,
  cancelUrl: string,
  deadline: string,
  headline: string,
  introLine: string,
  urgentBanner: string,
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
      <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">${headline}</h1>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
        Olá, ${menteeName}!
      </p>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
        ${introLine}
      </p>
      ${urgentBanner}
      ${objective ? `
      <div style="background-color: ${MOVE_COLORS.accent}; padding: 15px; border-radius: 12px; margin: 15px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
        <p style="color: ${MOVE_COLORS.text}; margin: 0;">🎯 <strong>Objetivo:</strong> ${objective}</p>
      </div>
      ` : ''}
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #f59e0b; text-align: center;">
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; font-weight: bold; margin: 0 0 15px 0;">
          VOCÊ PRECISA CONFIRMAR SUA PRESENÇA:
        </p>
        <div style="margin: 15px 0;">
          <a href="${confirmUrl}" style="background-color: #16a34a; color: white; padding: 14px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px; margin: 5px;">
            ✅ Confirmar Presença
          </a>
        </div>
        <div style="margin: 15px 0;">
          <a href="${cancelUrl}" style="background: #dc2626; color: white; padding: 10px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; margin: 5px;">
            Preciso cancelar
          </a>
        </div>
      </div>
      <div style="background-color: #fef2f2; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <p style="color: #dc2626; font-size: 14px; margin: 0; font-weight: bold;">
          ⚠️ Importante: É preciso confirmar com <strong>mais de 3 horas</strong> de antecedência ao horário de início (ou seja, antes de ${deadline}). Caso contrário, se o mentor tiver ativado o cancelamento automático, a sessão pode ser cancelada e o mentor será liberado.
        </p>
      </div>
      <p style="color: ${MOVE_COLORS.text}; font-size: 14px; line-height: 1.6; text-align: center;">
        Lembre-se: mentores são voluntários doando tempo.<br/>
        Respeite o compromisso! 🧡
      </p>
      <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; text-align: center; margin-top: 30px;">
        <strong style="color: ${MOVE_COLORS.primary};">Movê</strong> — educação que Move
      </p>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }
  
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

    if (res.ok) {
      console.log(`Reconfirmation sent to ${to}`);
      return true;
    } else {
      const err = await res.text();
      console.error(`Failed to send to ${to}:`, err);
      return false;
    }
  } catch (e) {
    console.error(`Error sending to ${to}:`, e);
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
    const MS_HOUR = 60 * 60 * 1000;
    const SEND_HOURS_BEFORE = 6;
    const SEND_WINDOW_MINUTES = 30;

    // Enviar aviso apenas na janela de 6h antes (com tolerância do cron de 30min).
    // Ex.: sessão 18:00 entra entre 12:00 e 12:30.
    const in6h = new Date(now.getTime() + SEND_HOURS_BEFORE * MS_HOUR).toISOString();
    const in6h30 = new Date(now.getTime() + (SEND_HOURS_BEFORE * 60 + SEND_WINDOW_MINUTES) * 60 * 1000).toISOString();

    const { data: sessions } = await adminClient
      .from("mentor_sessions")
      .select("*, mentors(name, email)")
      .eq("status", "scheduled")
      .eq("confirmed_by_mentor", true)
      .eq("reconfirmation_sent", false)
      .gte("scheduled_at", in6h)
      .lte("scheduled_at", in6h30);

    let sentCount = 0;

    if (sessions) {
      for (const session of sessions) {
        const mentorName = (session.mentors as any)?.name || "Mentor";
        const scheduledAt = new Date(session.scheduled_at);
        const dateStr = scheduledAt.toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });

        // Prazo: confirmação só vale com mais de 3h até o início (mesmo texto que o sistema usa)
        const deadline = new Date(scheduledAt.getTime() - 3 * MS_HOUR);
        const deadlineStr = deadline.toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        });

        const headline = "⏰ Confirme presença na sua mentoria";
        const introLine = `Sua mentoria com <strong>${mentorName}</strong> é <strong>hoje às ${dateStr}</strong> (aproximadamente em <strong>${SEND_HOURS_BEFORE} horas</strong>).`;
        const urgentBanner = "";

        // Get mentee info
        const { data: menteeProfile } = await adminClient
          .from("profiles")
          .select("name, email_notifications")
          .eq("user_id", session.user_id)
          .maybeSingle();

        const menteeName = menteeProfile?.name || "Mentorado";

        // Get mentee email
        const { data: menteeUser } = await adminClient.auth.admin.getUserById(session.user_id);
        const menteeEmail = menteeUser?.user?.email;

        if (!menteeEmail) continue;

        // Build confirmation/cancellation URLs
        const baseUrl = "https://movecarreiras.org";
        const confirmUrl = `${baseUrl}/reconfirmar?session=${session.id}&action=confirm`;
        const cancelUrl = `${baseUrl}/reconfirmar?session=${session.id}&action=cancel`;

        const subject = `⏰ Confirme presença: mentoria em ${SEND_HOURS_BEFORE}h`;

        const ok = await sendEmail(
          menteeEmail,
          subject,
          generateReconfirmationHtml(
            menteeName,
            mentorName,
            dateStr,
            session.mentee_objective,
            confirmUrl,
            cancelUrl,
            deadlineStr,
            headline,
            introLine,
            urgentBanner,
          )
        );

        if (ok) {
          await adminClient
            .from("mentor_sessions")
            .update({
              reconfirmation_sent: true,
              reconfirmation_sent_at: now.toISOString(),
            })
            .eq("id", session.id);
          sentCount++;
        }
      }
    }

    console.log(`Reconfirmation: ${sentCount} sent out of ${sessions?.length || 0} sessions`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: sessions?.length || 0 }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reconfirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
