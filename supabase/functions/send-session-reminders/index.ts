import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MOVE_COLORS = {
  primary: '#f97316',
  primaryDark: '#ea580c',
  primaryLight: '#fdba74',
  secondary: '#1e3a5f',
  accent: '#fff7ed',
  text: '#1e293b',
  textMuted: '#64748b',
};

const emailFooter = `
  <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; text-align: center; margin-top: 30px;">
    <strong style="color: ${MOVE_COLORS.primary};">Movê</strong> — educação que Move
  </p>
`;

function generateReminderHtml(
  name: string,
  role: "mentor" | "mentee",
  mentorName: string,
  menteeName: string,
  date: string,
  meetingLink: string | null,
  timeLabel: string
): string {
  const otherPerson = role === "mentor" ? menteeName : mentorName;
  const roleLabel = role === "mentor" ? "mentorado" : "mentor";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
      <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Sua mentoria está chegando! ⏰</h1>
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
        Olá, ${name}! Lembrete: sua mentoria é <strong>${timeLabel}</strong>.
      </p>
      <div style="background-color: ${MOVE_COLORS.accent}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
        <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>${role === "mentor" ? "Mentorado" : "Mentor"}:</strong> ${otherPerson}</p>
        <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Data/Hora:</strong> ${date}</p>
      </div>
      ${meetingLink ? `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${meetingLink}" style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px;">
          🎥 Entrar no Google Meet
        </a>
      </div>
      ` : ''}
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.secondary};">
        <p style="color: ${MOVE_COLORS.secondary}; font-size: 14px; margin: 0; font-weight: bold;">📌 Dicas:</p>
        <ul style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
          ${role === "mentee" ? `
          <li>Prepare suas dúvidas e objetivos com antecedência</li>
          <li>Esteja no horário — pontualidade é respeito</li>
          ` : `
          <li>Revise o perfil do mentorado antes da sessão</li>
          <li>Esteja disponível alguns minutos antes do horário</li>
          `}
        </ul>
      </div>
      <div style="text-align: center; margin-top: 25px;">
        <a href="https://movecarreiras.org/dashboard" 
           style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
          Acessar Plataforma
        </a>
      </div>
      ${emailFooter}
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
      console.log(`Reminder sent to ${to}`);
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

    // Find sessions that are 24h away (between 23h and 25h from now)
    const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    // Find sessions that are 1h away (between 50min and 70min from now)
    const in50m = new Date(now.getTime() + 50 * 60 * 1000).toISOString();
    const in70m = new Date(now.getTime() + 70 * 60 * 1000).toISOString();

    // Fetch sessions in both windows
    const { data: sessions24h } = await adminClient
      .from("mentor_sessions")
      .select("*, mentors(name, email)")
      .eq("status", "scheduled")
      .eq("confirmed_by_mentor", true)
      .gte("scheduled_at", in23h)
      .lte("scheduled_at", in25h);

    const { data: sessions1h } = await adminClient
      .from("mentor_sessions")
      .select("*, mentors(name, email)")
      .eq("status", "scheduled")
      .eq("confirmed_by_mentor", true)
      .gte("scheduled_at", in50m)
      .lte("scheduled_at", in70m);

    let sentCount = 0;
    let failedCount = 0;

    const processSession = async (session: any, timeLabel: string) => {
      const mentorName = (session.mentors as any)?.name || "Mentor";
      const mentorEmail = (session.mentors as any)?.email;
      const scheduledAt = new Date(session.scheduled_at);
      const dateStr = scheduledAt.toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long',
        hour: '2-digit', minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });

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

      // Send to mentee (if notifications enabled)
      if (menteeEmail && menteeProfile?.email_notifications !== false) {
        const subject = timeLabel === "amanhã"
          ? "Lembrete: sua mentoria é amanhã! ⏰"
          : "Sua mentoria começa em 1 hora! 🚀";

        const ok = await sendEmail(
          menteeEmail,
          subject,
          generateReminderHtml(menteeName, "mentee", mentorName, menteeName, dateStr, session.meeting_link, timeLabel)
        );
        ok ? sentCount++ : failedCount++;
      }

      // Send to mentor
      if (mentorEmail) {
        const subject = timeLabel === "amanhã"
          ? "Lembrete: você tem uma mentoria amanhã! ⏰"
          : "Sua mentoria começa em 1 hora! 🚀";

        const ok = await sendEmail(
          mentorEmail,
          subject,
          generateReminderHtml(mentorName, "mentor", mentorName, menteeName, dateStr, session.meeting_link, timeLabel)
        );
        ok ? sentCount++ : failedCount++;
      }
    };

    // Process 24h reminders
    if (sessions24h) {
      for (const session of sessions24h) {
        await processSession(session, "amanhã");
      }
    }

    // Process 1h reminders
    if (sessions1h) {
      for (const session of sessions1h) {
        await processSession(session, "em 1 hora");
      }
    }

    console.log(`Session reminders: ${sentCount} sent, ${failedCount} failed. 24h sessions: ${sessions24h?.length || 0}, 1h sessions: ${sessions1h?.length || 0}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        sessions_24h: sessions24h?.length || 0,
        sessions_1h: sessions1h?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-session-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
