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

function generateNudgeHtml(name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
      <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Falta pouco, ${name}! 🚀</h1>
      
      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.8;">
        Você está a <strong>um passo</strong> de ter acesso a uma rede de mentores experientes prontos para te ajudar na sua carreira.
      </p>

      <div style="background-color: ${MOVE_COLORS.accent}; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
        <p style="color: ${MOVE_COLORS.text}; font-size: 15px; font-weight: bold; margin: 0 0 15px 0;">
          📋 O que falta para agendar sua primeira mentoria:
        </p>
        <ol style="color: ${MOVE_COLORS.text}; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
          <li>✅ Fazer o <strong>quiz de onboarding</strong> (rápido, menos de 2 minutos!)</li>
          <li>✅ Aceitar os <strong>termos de compromisso</strong></li>
          <li>✅ Escolher um mentor e <strong>agendar sua primeira sessão</strong></li>
        </ol>
      </div>

      <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.8;">
        Uma conversa de 30 minutos com alguém experiente pode abrir portas que você nem sabia que existiam. 💡
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://movecarreiras.org/dashboard" 
           style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px;">
          Começar agora →
        </a>
      </div>

      <div style="margin-top: 30px; padding: 20px; border-top: 2px solid ${MOVE_COLORS.primaryLight}; background: linear-gradient(135deg, ${MOVE_COLORS.accent} 0%, #fef3e2 100%); border-radius: 12px;">
        <p style="color: ${MOVE_COLORS.text}; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0; font-style: italic;">
          "Uma conversa pode mudar uma carreira. E uma carreira pode mudar uma vida."
        </p>
        <p style="color: ${MOVE_COLORS.primary}; font-weight: bold; margin: 0; font-size: 13px;">
          — Time Movê
        </p>
      </div>

      <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; text-align: center; margin-top: 30px;">
        <strong style="color: ${MOVE_COLORS.primary};">Movê</strong> — educação que Move
      </p>
      <p style="color: ${MOVE_COLORS.textMuted}; font-size: 11px; text-align: center; margin-top: 10px;">
        Se você não quiser receber mais esses lembretes, pode desativar as notificações nas configurações do seu perfil.
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
      console.log(`Onboarding nudge sent to ${to}`);
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

    // Find mentees who:
    // 1. Have NOT passed the onboarding quiz
    // 2. Have email notifications enabled
    // 3. Registered more than 2 days ago (give them time to complete on their own)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("user_id, name, email_notifications, onboarding_quiz_passed, created_at")
      .eq("onboarding_quiz_passed", false)
      .eq("email_notifications", true)
      .lte("created_at", twoDaysAgo);

    if (error) {
      console.error("Error fetching profiles:", error);
      throw new Error("Failed to fetch profiles");
    }

    if (!profiles || profiles.length === 0) {
      console.log("No mentees need onboarding nudge");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No mentees to nudge" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Exclude mentors (they don't need to do the quiz)
    const userIds = profiles.map(p => p.user_id);
    const { data: mentors } = await adminClient
      .from("mentors")
      .select("email");

    const { data: users } = await adminClient.auth.admin.listUsers();
    
    const mentorEmails = new Set((mentors || []).map(m => m.email.toLowerCase()));
    const emailMap = new Map<string, string>();
    (users?.users || []).forEach(u => {
      if (u.email && userIds.includes(u.id)) {
        emailMap.set(u.id, u.email);
      }
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const profile of profiles) {
      const email = emailMap.get(profile.user_id);
      if (!email) continue;

      // Skip if this user is a mentor
      if (mentorEmails.has(email.toLowerCase())) {
        skippedCount++;
        continue;
      }

      const ok = await sendEmail(
        email,
        "Falta pouco para sua primeira mentoria! 🚀",
        generateNudgeHtml(profile.name || "Mentorado")
      );

      if (ok) sentCount++;

      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    console.log(`Onboarding nudge: ${sentCount} sent, ${skippedCount} skipped (mentors)`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, skipped: skippedCount, total: profiles.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-onboarding-nudge:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
