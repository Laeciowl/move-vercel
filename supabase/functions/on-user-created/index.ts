import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const emailFooter = `
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
    <strong>Movê — educação que Move</strong>
  </p>
`;

interface UserCreatedPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    user_id: string;
    name: string;
    city: string;
    state: string;
    email_notifications: boolean;
  };
  schema: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  const fromEmail = "Movê <noreply@movecarreiras.org>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
  }

  return await res.json();
}

async function getAdminEmails(): Promise<string[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: adminRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (!adminRoles || adminRoles.length === 0) {
    return [];
  }

  const { data: authData } = await supabase.auth.admin.listUsers();
  const adminEmails: string[] = [];
  
  for (const role of adminRoles) {
    const user = authData?.users?.find(u => u.id === role.user_id);
    if (user?.email) {
      adminEmails.push(user.email);
    }
  }

  return adminEmails;
}

async function getUserEmail(userId: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email || null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: UserCreatedPayload = await req.json();
    console.log("Received payload:", JSON.stringify(payload));

    const { record } = payload;
    const userEmail = await getUserEmail(record.user_id);

    if (!userEmail) {
      console.error("Could not find user email for user_id:", record.user_id);
      return new Response(JSON.stringify({ error: "User email not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 1. Send registration confirmation email to user (transactional - always send)
    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #22c55e; text-align: center;">Conta criada com sucesso! ✅</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${record.name}! Sua conta no <strong>Movê</strong> foi criada com sucesso.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Agora você tem acesso a todos os nossos recursos:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 1.8;">
          <li>📚 Aulas e lives gratuitas</li>
          <li>📄 Templates e guias práticos</li>
          <li>🎯 Mentorias com profissionais</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get("SITE_URL") || "https://movesocial.lovable.app"}/dashboard" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar minha conta
          </a>
        </div>
        ${emailFooter}
      </div>
    `;

    try {
      await sendEmail(userEmail, "Sua conta foi criada com sucesso! ✅", confirmationHtml);
      console.log("Registration confirmation email sent to:", userEmail);
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
    }

    // 2. Send notification to admins
    const adminEmails = await getAdminEmails();
    console.log("Admin emails found:", adminEmails);

    if (adminEmails.length > 0) {
      const adminNotificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #7c3aed; text-align: center;">Novo cadastro! 📊</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Um novo usuário se cadastrou na plataforma Movê.
          </p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #333; margin: 0;"><strong>Nome:</strong> ${record.name}</p>
            <p style="color: #333; margin: 10px 0 0 0;"><strong>Email:</strong> ${userEmail}</p>
            <p style="color: #333; margin: 10px 0 0 0;"><strong>Cidade:</strong> ${record.city}</p>
            <p style="color: #333; margin: 10px 0 0 0;"><strong>Estado:</strong> ${record.state}</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get("SITE_URL") || "https://movesocial.lovable.app"}/admin" 
               style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Acessar Painel Admin
            </a>
          </div>
          ${emailFooter}
        </div>
      `;

      for (const adminEmail of adminEmails) {
        try {
          await sendEmail(adminEmail, "Novo usuário cadastrado no Movê 📊", adminNotificationHtml);
          console.log("Admin notification sent to:", adminEmail);
        } catch (emailError) {
          console.error("Error sending admin notification to:", adminEmail, emailError);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in on-user-created function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);