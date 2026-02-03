import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE_URL = Deno.env.get("SITE_URL") || "https://movesocial.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Movê brand colors
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
  <p style="color: ${MOVE_COLORS.textMuted}; font-size: 11px; text-align: center; margin-top: 10px;">
    Se você não quiser receber mais esses lembretes, pode desativar as notificações nas configurações do seu perfil.
  </p>
`;

const founderSignature = `
  <div style="margin-top: 30px; padding: 20px; border-top: 2px solid ${MOVE_COLORS.primaryLight}; background: linear-gradient(135deg, ${MOVE_COLORS.accent} 0%, #fef3e2 100%); border-radius: 12px;">
    <p style="color: ${MOVE_COLORS.text}; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0; font-style: italic;">
      "Uma conversa pode mudar uma carreira. E uma carreira pode mudar uma vida."
    </p>
    <p style="color: ${MOVE_COLORS.primary}; font-weight: bold; margin: 0; font-size: 13px;">
      — Time Movê
    </p>
  </div>
`;

const generateReminderEmail = (name: string): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
    <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Ei, ${name}! 👋</h1>
    
    <p style="color: ${MOVE_COLORS.text}; font-size: 18px; line-height: 1.6; text-align: center; margin: 20px 0;">
      <strong>Já marcou sua mentoria?</strong>
    </p>
    
    <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
      Lembrete: você tem acesso a mentores incríveis prontos para te ouvir, trocar experiências e te ajudar a dar os próximos passos na sua carreira.
    </p>
    
    <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
      Uma conversa de 30 minutos pode fazer toda a diferença. Que tal escolher um mentor e agendar agora?
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${SITE_URL}/mentores" 
         style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 16px;">
        🚀 Agendar Mentoria
      </a>
    </div>
    
    <p style="color: ${MOVE_COLORS.textMuted}; font-size: 14px; line-height: 1.6; text-align: center;">
      Vamos colocar sua carreira em movimento!
    </p>
    
    ${founderSignature}
    ${emailFooter}
  </div>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all users who have email notifications enabled
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, email_notifications")
      .eq("email_notifications", true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw new Error("Failed to fetch profiles");
    }

    if (!profiles || profiles.length === 0) {
      console.log("No users with email notifications enabled");
      return new Response(
        JSON.stringify({ message: "No users to notify", sent: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get user emails from auth.users
    const userIds = profiles.map(p => p.user_id);
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Failed to fetch user emails");
    }

    // Create a map of user_id to email
    const emailMap = new Map<string, string>();
    users.users.forEach(u => {
      if (u.email && userIds.includes(u.id)) {
        emailMap.set(u.id, u.email);
      }
    });

    // Send emails to each eligible user
    let sentCount = 0;
    let failedCount = 0;

    for (const profile of profiles) {
      const email = emailMap.get(profile.user_id);
      if (!email) {
        console.log(`No email found for user ${profile.user_id}`);
        continue;
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
            to: [email],
            subject: "Ei, já marcou sua mentoria? 🚀",
            html: generateReminderEmail(profile.name || "Mentorado"),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`Reminder email sent to ${email}:`, data);
          sentCount++;
        } else {
          const errorText = await res.text();
          console.error(`Failed to send to ${email}:`, errorText);
          failedCount++;
        }
      } catch (emailError) {
        console.error(`Error sending to ${email}:`, emailError);
        failedCount++;
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Reminder emails completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Reminder emails processed", 
        sent: sentCount,
        failed: failedCount,
        total: profiles.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-mentorship-reminder:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
