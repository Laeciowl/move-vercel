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

type EmailType = 
  | "session_scheduled" 
  | "session_confirmed" 
  | "session_cancelled" 
  | "content_approved" 
  | "content_rejected" 
  | "mentor_approved" 
  | "welcome"
  | "registration_confirmation"
  | "volunteer_approved"
  | "new_user_admin_notification";

interface NotificationEmailRequest {
  to: string;
  name: string;
  type: EmailType;
  data?: Record<string, string>;
  skipPreferenceCheck?: boolean; // For transactional emails that must always be sent
}

const emailFooter = `
  <div style="margin-top: 40px; padding: 20px; border-top: 1px solid #eee; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 0 0 8px 8px;">
    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0; font-style: italic;">
      "Obrigado por se unir à Comunidade Movê! Juntos, criamos um movimento que move a sociedade. 
      Cada conexão, cada mentoria, cada aprendizado nos aproxima de um futuro onde todos têm as mesmas oportunidades."
    </p>
    <p style="color: #7c3aed; font-weight: bold; margin: 0; font-size: 13px;">
      — Laécio Oliveira, Fundador da Movê
    </p>
  </div>
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
    <strong>Movê — educação que Move</strong>
  </p>
`;

const emailTemplates: Record<string, { subject: string; html: (name: string, data?: Record<string, string>) => string; isTransactional?: boolean }> = {
  welcome: {
    subject: "Bem-vindo ao Movê! 🎉",
    isTransactional: false,
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Olá, ${name}! 👋</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Seja muito bem-vindo(a) ao <strong>Movê</strong>! Estamos muito felizes em ter você conosco.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Aqui você terá acesso a:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 1.8;">
          <li>📚 Conteúdos educacionais gratuitos</li>
          <li>🎯 Mentorias com profissionais experientes</li>
          <li>👥 Uma comunidade acolhedora</li>
        </ul>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Explore a plataforma e não hesite em nos procurar se precisar de ajuda!
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get("SITE_URL") || "https://movesocial.lovable.app"}/dashboard" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar Plataforma
          </a>
        </div>
        ${emailFooter}
      </div>
    `,
  },
  registration_confirmation: {
    subject: "Sua conta foi criada com sucesso! ✅",
    isTransactional: true,
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #22c55e; text-align: center;">Conta criada com sucesso! ✅</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Sua conta no <strong>Movê</strong> foi criada com sucesso.
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
    `,
  },
  volunteer_approved: {
    subject: "Você foi aprovado como Voluntário! 🎉",
    isTransactional: true,
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #22c55e; text-align: center;">Parabéns, ${name}! 🎉</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Sua candidatura como <strong>voluntário</strong> no Movê foi aprovada!
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Agora você pode:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 1.8;">
          <li>🗓️ Definir sua disponibilidade para mentorias</li>
          <li>📤 Enviar conteúdos educacionais</li>
          <li>💬 Ajudar pessoas em sua jornada profissional</li>
        </ul>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Obrigado por fazer parte dessa missão de transformar vidas!
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get("SITE_URL") || "https://movesocial.lovable.app"}/dashboard" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar Painel
          </a>
        </div>
        ${emailFooter}
      </div>
    `,
  },
  new_user_admin_notification: {
    subject: "Novo usuário cadastrado no Movê 📊",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #7c3aed; text-align: center;">Novo cadastro! 📊</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Um novo usuário se cadastrou na plataforma Movê.
        </p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #333; margin: 0;"><strong>Nome:</strong> ${name}</p>
          <p style="color: #333; margin: 10px 0 0 0;"><strong>Email:</strong> ${data?.email || "N/A"}</p>
          <p style="color: #333; margin: 10px 0 0 0;"><strong>Cidade:</strong> ${data?.city || "N/A"}</p>
          <p style="color: #333; margin: 10px 0 0 0;"><strong>Estado:</strong> ${data?.state || "N/A"}</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get("SITE_URL") || "https://movesocial.lovable.app"}/admin" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar Painel Admin
          </a>
        </div>
        ${emailFooter}
      </div>
    `,
  },
  session_scheduled: {
    subject: "Mentoria agendada com sucesso! 📅",
    isTransactional: false,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center;">Mentoria Agendada! 🎯</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Sua mentoria foi agendada com sucesso.
        </p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #333; margin: 0;"><strong>Mentor:</strong> ${data?.mentorName || "A confirmar"}</p>
          <p style="color: #333; margin: 10px 0 0 0;"><strong>Data:</strong> ${data?.date || "A confirmar"}</p>
        </div>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          O mentor confirmará a sessão em breve. Você receberá uma notificação quando isso acontecer.
        </p>
        ${emailFooter}
      </div>
    `,
  },
  session_confirmed: {
    subject: "Sua mentoria foi confirmada! ✅",
    isTransactional: false,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #22c55e; text-align: center;">Mentoria Confirmada! ✅</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Ótimas notícias - sua mentoria foi confirmada pelo mentor!
        </p>
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #333; margin: 0;"><strong>Mentor:</strong> ${data?.mentorName || ""}</p>
          <p style="color: #333; margin: 10px 0 0 0;"><strong>Data:</strong> ${data?.date || ""}</p>
        </div>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Prepare-se para a sessão! Anote suas dúvidas e objetivos para aproveitar ao máximo.
        </p>
        ${emailFooter}
      </div>
    `,
  },
  session_cancelled: {
    subject: "Mentoria cancelada",
    isTransactional: false,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #ef4444; text-align: center;">Mentoria Cancelada</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${name}. Infelizmente sua mentoria agendada para ${data?.date || ""} foi cancelada.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Você pode agendar uma nova sessão com outro mentor disponível na plataforma.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get("SITE_URL") || "https://movesocial.lovable.app"}/mentores" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Ver Mentores
          </a>
        </div>
        ${emailFooter}
      </div>
    `,
  },
  content_approved: {
    subject: "Seu conteúdo foi aprovado! 🎉",
    isTransactional: false,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #22c55e; text-align: center;">Conteúdo Aprovado! 🎉</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Seu conteúdo "${data?.title || ""}" foi aprovado e já está disponível para a comunidade.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Obrigado por contribuir com o Movê! Sua dedicação ajuda a transformar vidas.
        </p>
        ${emailFooter}
      </div>
    `,
  },
  content_rejected: {
    subject: "Atualização sobre seu conteúdo",
    isTransactional: false,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b; text-align: center;">Conteúdo Precisa de Ajustes</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${name}. Analisamos seu conteúdo "${data?.title || ""}" e infelizmente ele não atendeu aos nossos critérios no momento.
        </p>
        ${data?.reason ? `<p style="color: #666; font-size: 16px; line-height: 1.6;"><strong>Motivo:</strong> ${data.reason}</p>` : ""}
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Você pode fazer os ajustes necessários e reenviar o conteúdo. Estamos aqui para ajudar!
        </p>
        ${emailFooter}
      </div>
    `,
  },
  mentor_approved: {
    subject: "Você foi aprovado como Mentor! 🌟",
    isTransactional: true,
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #22c55e; text-align: center;">Bem-vindo à equipe de Mentores! 🌟</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Parabéns! Sua candidatura como mentor foi aprovada!
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Agora você pode:
        </p>
        <ul style="color: #666; font-size: 16px; line-height: 1.8;">
          <li>🗓️ Definir sua disponibilidade</li>
          <li>👥 Receber agendamentos de mentorias</li>
          <li>💬 Ajudar pessoas em sua jornada profissional</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${Deno.env.get("SITE_URL") || "https://movesocial.lovable.app"}/dashboard" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar Painel
          </a>
        </div>
        ${emailFooter}
      </div>
    `,
  },
};

// Check if user has email notifications enabled
async function checkEmailPreference(email: string): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log("Missing Supabase credentials, skipping preference check");
    return true;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // First, try to find user by email in auth.users
  const { data: authUser } = await supabase.auth.admin.listUsers();
  const user = authUser?.users?.find(u => u.email === email);
  
  if (!user) {
    // User not found, allow email (might be new user)
    return true;
  }

  // Check profile preference
  const { data: profile } = await supabase
    .from("profiles")
    .select("email_notifications")
    .eq("user_id", user.id)
    .single();

  return profile?.email_notifications ?? true;
}

// Get admin emails for notifications
async function getAdminEmails(): Promise<string[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log("Missing Supabase credentials");
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Get all users with admin role
  const { data: adminRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  if (!adminRoles || adminRoles.length === 0) {
    return [];
  }

  // Get admin emails from auth
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name, type, data, skipPreferenceCheck }: NotificationEmailRequest = await req.json();

    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Template '${type}' not found`);
    }

    // Check if this is a transactional email (must always be sent)
    const isTransactional = template.isTransactional || skipPreferenceCheck;

    // For non-transactional emails, check user preference
    if (!isTransactional) {
      const canSend = await checkEmailPreference(to);
      if (!canSend) {
        console.log(`User ${to} has disabled email notifications, skipping`);
        return new Response(JSON.stringify({ 
          success: true, 
          skipped: true,
          reason: "User has disabled email notifications" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Use verified custom domain
    const fromEmail = "Movê <noreply@movecarreiras.org>";

    // Use Resend API directly via fetch
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: template.subject,
        html: template.html(name, data),
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
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

// Export helper function for admin notifications
export { getAdminEmails };