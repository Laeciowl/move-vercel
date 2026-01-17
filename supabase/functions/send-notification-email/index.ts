import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  to: string;
  name: string;
  type: "session_scheduled" | "session_confirmed" | "session_cancelled" | "content_approved" | "content_rejected" | "mentor_approved" | "welcome";
  data?: Record<string, string>;
}

const emailTemplates: Record<string, { subject: string; html: (name: string, data?: Record<string, string>) => string }> = {
  welcome: {
    subject: "Bem-vindo ao Movê! 🎉",
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
          <a href="${Deno.env.get("SITE_URL") || "https://move.org.br"}/dashboard" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar Plataforma
          </a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">
          Movê - Educação e acolhimento para transformar vidas.
        </p>
      </div>
    `,
  },
  session_scheduled: {
    subject: "Mentoria agendada com sucesso! 📅",
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
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">
          Movê - Educação e acolhimento para transformar vidas.
        </p>
      </div>
    `,
  },
  session_confirmed: {
    subject: "Sua mentoria foi confirmada! ✅",
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
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">
          Movê - Educação e acolhimento para transformar vidas.
        </p>
      </div>
    `,
  },
  session_cancelled: {
    subject: "Mentoria cancelada",
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
          <a href="${Deno.env.get("SITE_URL") || "https://move.org.br"}/mentores" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Ver Mentores
          </a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">
          Movê - Educação e acolhimento para transformar vidas.
        </p>
      </div>
    `,
  },
  content_approved: {
    subject: "Seu conteúdo foi aprovado! 🎉",
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #22c55e; text-align: center;">Conteúdo Aprovado! 🎉</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Seu conteúdo "${data?.title || ""}" foi aprovado e já está disponível para a comunidade.
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          Obrigado por contribuir com o Movê! Sua dedicação ajuda a transformar vidas.
        </p>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">
          Movê - Educação e acolhimento para transformar vidas.
        </p>
      </div>
    `,
  },
  content_rejected: {
    subject: "Atualização sobre seu conteúdo",
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
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">
          Movê - Educação e acolhimento para transformar vidas.
        </p>
      </div>
    `,
  },
  mentor_approved: {
    subject: "Você foi aprovado como Mentor! 🌟",
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
          <a href="${Deno.env.get("SITE_URL") || "https://move.org.br"}/dashboard" 
             style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Acessar Painel
          </a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 40px;">
          Movê - Educação e acolhimento para transformar vidas.
        </p>
      </div>
    `,
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name, type, data }: NotificationEmailRequest = await req.json();

    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Template '${type}' not found`);
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
