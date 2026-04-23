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
  | "session_confirmed_mentor"
  | "session_cancelled" 
  | "session_cancelled_notification"
  | "session_rescheduled"
  | "session_request_mentor"
  | "session_review_request"
  | "content_approved" 
  | "content_rejected" 
  | "mentor_approved" 
  | "mentor_application_received"
  | "welcome"
  | "registration_confirmation"
  | "volunteer_approved"
  | "volunteer_application_received"
  | "new_user_admin_notification"
  | "mentee_reconfirmed";

interface NotificationEmailRequest {
  to: string;
  name: string;
  type: EmailType;
  data?: Record<string, string>;
  skipPreferenceCheck?: boolean; // For transactional emails that must always be sent
}

// Movê brand colors
const MOVE_COLORS = {
  primary: '#f97316', // Orange (hsl 24 95% 53%)
  primaryDark: '#ea580c', // Darker orange
  primaryLight: '#fdba74', // Light orange
  secondary: '#1e3a5f', // Deep blue (hsl 220 60% 25%)
  accent: '#fff7ed', // Light warm background
  text: '#1e293b', // Dark foreground
  textMuted: '#64748b', // Muted text
  success: '#22c55e', // Green
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red
};

const emailFooter = `
  <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; text-align: center; margin-top: 30px;">
    <strong style="color: ${MOVE_COLORS.primary};">Movê</strong> — educação que Move
  </p>
`;

const studentWelcomeMessage = `
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    Que bom ter você por aqui 😊
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    Ao se inscrever na Movê, você passa a fazer parte de uma comunidade que acredita que carreira não é linha reta — é movimento, troca, aprendizado e apoio ao longo do caminho.
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    A Movê nasceu para conectar pessoas a orientação real, experiências práticas e conversas honestas sobre carreira. Aqui, ninguém caminha sozinho. A ideia é aprender junto, trocar vivências e evoluir passo a passo.
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    Esse é só o começo — e ficamos felizes de ter você com a gente nessa jornada.
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    <strong style="color: ${MOVE_COLORS.primary};">Seja muito bem-vindo(a).</strong><br>
    Vamos colocar sua carreira em movimento 🚀
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6; margin-top: 20px;">
    Abraços,<br>
    <strong style="color: ${MOVE_COLORS.primary};">Time Movê</strong>
  </p>
`;

const volunteerWelcomeMessage = `
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    Muito obrigado por se inscrever como voluntário(a) na Movê 🧡
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    Ao dar esse passo, você ajuda a construir algo maior: um movimento que acredita no poder da orientação, da escuta e da troca genuína para transformar trajetórias profissionais.
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    Compartilhar sua experiência pode fazer muita diferença na vida de alguém — e é isso que move a Movê todos os dias. Aqui, voluntários não são "apoio", são parte central do movimento.
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    Estamos muito felizes de ter você com a gente. Em breve, entraremos em contato com os próximos passos.
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
    <strong style="color: ${MOVE_COLORS.primary};">Obrigado por doar seu tempo, sua experiência e sua vontade de ajudar.</strong><br>
    Juntos, colocamos carreiras em movimento 🚀
  </p>
  <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6; margin-top: 20px;">
    Com carinho,<br>
    <strong style="color: ${MOVE_COLORS.primary};">Time Movê</strong>
  </p>
`;

const founderSignature = `
  <div style="margin-top: 30px; padding: 20px; border-top: 2px solid ${MOVE_COLORS.primaryLight}; background: linear-gradient(135deg, ${MOVE_COLORS.accent} 0%, #fef3e2 100%); border-radius: 12px;">
    <p style="color: ${MOVE_COLORS.text}; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0; font-style: italic;">
      "Juntos, criamos um movimento que move a sociedade. Cada conexão, cada mentoria, cada aprendizado nos aproxima de um futuro onde todos têm as mesmas oportunidades."
    </p>
    <p style="color: ${MOVE_COLORS.primary}; font-weight: bold; margin: 0; font-size: 13px;">
      — Laecio Oliveira, Fundador da Movê
    </p>
    <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; margin: 8px 0 0 0;">
      Contato: <a href="https://www.linkedin.com/in/laecio-rodrigues" style="color: ${MOVE_COLORS.primary}; text-decoration: underline;">LinkedIn</a>
    </p>
  </div>
`;

const emailTemplates: Record<string, { subject: string; html: (name: string, data?: Record<string, string>) => string; isTransactional?: boolean }> = {
  welcome: {
    subject: "Bem-vindo à Movê! 🎉",
    isTransactional: false,
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Oi, ${name}! 👋</h1>
        ${studentWelcomeMessage}
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/dashboard" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Acessar Plataforma
          </a>
        </div>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  registration_confirmation: {
    subject: "Bem-vindo à Movê! 🚀",
    isTransactional: true,
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Oi, ${name}! 👋</h1>
        ${studentWelcomeMessage}
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/dashboard" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Acessar minha conta
          </a>
        </div>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  volunteer_approved: {
    subject: "Você foi aprovado como Voluntário! 🎉",
    isTransactional: true,
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.success}; text-align: center;">Parabéns, ${name}! 🎉</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Sua candidatura como <strong style="color: ${MOVE_COLORS.primary};">voluntário</strong> na Movê foi aprovada!
        </p>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Agora você pode:
        </p>
        <ul style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.8;">
          <li>🗓️ Definir sua disponibilidade para mentorias</li>
          <li>📤 Enviar conteúdos educacionais</li>
          <li>💬 Ajudar pessoas em sua jornada profissional</li>
        </ul>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Obrigado por fazer parte dessa missão de transformar vidas!
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/dashboard" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Acessar Painel
          </a>
        </div>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  volunteer_application_received: {
    subject: "Obrigado por se voluntariar! 🧡",
    isTransactional: true,
    html: (name) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Oi, ${name}! 👋</h1>
        ${volunteerWelcomeMessage}
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Conhecer mais sobre a Movê
          </a>
        </div>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  new_user_admin_notification: {
    subject: "Novo usuário cadastrado na Movê 📊",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Novo cadastro! 📊</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Um novo usuário se cadastrou na plataforma Movê.
        </p>
        <div style="background-color: ${MOVE_COLORS.accent}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
          <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>Nome:</strong> ${name}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Email:</strong> ${data?.email || "N/A"}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Cidade:</strong> ${data?.city || "N/A"}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Estado:</strong> ${data?.state || "N/A"}</p>
          ${data?.menteeDiscoveryLabel ? `<p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Como conheceu a Movê:</strong> ${data.menteeDiscoveryLabel}</p>` : ""}
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/admin" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Mentoria Agendada! 🎯</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Sua mentoria foi agendada com sucesso.
        </p>
        <div style="background-color: ${MOVE_COLORS.accent}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
          <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>Mentor:</strong> ${data?.mentorName || "A confirmar"}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Data:</strong> ${data?.date || "A confirmar"}</p>
        </div>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          O mentor confirmará a sessão em breve. Você receberá uma notificação quando isso acontecer.
        </p>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  session_confirmed: {
    subject: "Sua mentoria foi confirmada! ✅",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.success}; text-align: center;">Mentoria Confirmada! ✅</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Ótimas notícias - sua mentoria foi confirmada pelo mentor!
        </p>
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.success};">
          <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>Mentor:</strong> ${data?.mentorName || ""}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Data:</strong> ${data?.date || ""}</p>
        </div>
        ${data?.meetingLink ? `
        <div style="background-color: #e0f2fe; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0284c7; text-align: center;">
          <p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">🎥 Link da reunião criado automaticamente:</p>
          <a href="${data.meetingLink}" style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">
            Entrar no Google Meet
          </a>
          <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; margin: 10px 0 0 0;">
            📅 Um convite também foi enviado para o seu Google Calendar no e-mail cadastrado.
          </p>
        </div>
        ` : `
        <div style="background-color: ${MOVE_COLORS.accent}; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
          <p style="color: ${MOVE_COLORS.primaryDark}; font-size: 14px; margin: 0; font-weight: bold;">📌 Próximos passos:</p>
          <p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 10px 0 0 0;">
            O mentor entrará em contato com você para confirmar os detalhes da sessão (plataforma, link da reunião, etc). A sessão pode ser realizada por Google Meet, Zoom ou outra plataforma de preferência.
          </p>
        </div>
        `}
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Prepare-se para a sessão! Anote suas dúvidas e objetivos para aproveitar ao máximo.
        </p>

        <!-- Reschedule link -->
        <div style="text-align: center; margin: 25px 0;">
          <p style="color: ${MOVE_COLORS.textMuted}; font-size: 14px; margin: 0 0 10px 0;">Precisa remarcar?</p>
          <a href="https://movecarreiras.org/dashboard#mentorship-section" 
             style="color: ${MOVE_COLORS.primary}; font-size: 14px; font-weight: bold; text-decoration: underline;">
            Remarcar minha mentoria
          </a>
        </div>

        <!-- Platform link -->
        <div style="text-align: center; margin: 20px 0;">
          <a href="https://movecarreiras.org" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Acessar movecarreiras.org
          </a>
        </div>

        ${founderSignature}

        <!-- Referral section -->
        <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #fef3e2 0%, #fff7ed 100%); border-radius: 12px; text-align: center; border: 1px dashed ${MOVE_COLORS.primaryLight};">
          <p style="color: ${MOVE_COLORS.text}; font-size: 15px; margin: 0 0 10px 0; font-weight: bold;">
            💜 Conhece alguém que precisa de orientação profissional?
          </p>
          <p style="color: ${MOVE_COLORS.textMuted}; font-size: 13px; margin: 0 0 15px 0;">
            Indique a Movê para um amigo e ajude mais pessoas a transformarem suas carreiras!
          </p>
          <a href="https://movecarreiras.org" 
             style="background: ${MOVE_COLORS.secondary}; color: white; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">
            Indicar a Movê para um amigo
          </a>
        </div>

        ${emailFooter}
      </div>
    `,
  },
  session_confirmed_mentor: {
    subject: "Você confirmou uma mentoria! 📅",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.success}; text-align: center;">Mentoria Confirmada! 📅</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Você confirmou uma sessão de mentoria.
        </p>
        <div style="background-color: #dcfce7; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.success};">
          <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>Mentorado:</strong> ${data?.menteeName || ""}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Data:</strong> ${data?.date || ""}</p>
        </div>
        
        ${data?.meetingLink ? `
        <div style="background-color: #e0f2fe; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0284c7; text-align: center;">
          <p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 0 0 10px 0; font-weight: bold;">🎥 Link da reunião criado automaticamente:</p>
          <a href="${data.meetingLink}" style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">
            Entrar no Google Meet
          </a>
          <p style="color: ${MOVE_COLORS.textMuted}; font-size: 12px; margin: 10px 0 0 0;">
            📅 Um convite também foi enviado para o seu Google Calendar no e-mail cadastrado.
          </p>
        </div>
        ` : ''}

        <div style="background-color: ${MOVE_COLORS.accent}; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
          <p style="color: ${MOVE_COLORS.primaryDark}; font-size: 14px; margin: 0; font-weight: bold;">📞 Dados de contato do mentorado:</p>
          ${data?.menteeEmail ? `<p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 10px 0 0 0;"><strong>Email:</strong> <a href="mailto:${data.menteeEmail}" style="color: ${MOVE_COLORS.primary};">${data.menteeEmail}</a></p>` : ''}
          ${data?.menteePhone ? `<p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 5px 0 0 0;"><strong>Telefone:</strong> ${data.menteePhone}</p>` : ''}
        </div>

        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.secondary};">
          <p style="color: ${MOVE_COLORS.secondary}; font-size: 14px; margin: 0; font-weight: bold;">📌 Importante:</p>
          <ul style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
            <li>Entre em contato com o mentorado <strong>até 24h antes</strong> da sessão para confirmar os detalhes.</li>
            ${!data?.meetingLink ? `<li>A sessão pode ser realizada por Google Meet, Zoom ou qualquer plataforma de sua escolha.</li>
            <li>Combine o link da reunião diretamente com o mentorado.</li>` : ''}
          </ul>
        </div>
        
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Obrigado por dedicar seu tempo para ajudar alguém em sua jornada profissional! 🧡
        </p>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  session_cancelled: {
    subject: "Mentoria cancelada",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.error}; text-align: center;">Mentoria Cancelada</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}. Infelizmente sua mentoria agendada para ${data?.date || ""} foi cancelada.
        </p>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Você pode agendar uma nova sessão com outro mentor disponível na plataforma.
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/mentores" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Ver Mentores
          </a>
        </div>
        ${emailFooter}
      </div>
    `,
  },
  session_cancelled_notification: {
    subject: "Sua mentoria foi cancelada 😔",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.error}; text-align: center;">Mentoria Cancelada</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}. Infelizmente sua mentoria foi cancelada.
        </p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.error};">
          <p style="color: #991b1b; margin: 0;"><strong>Data original:</strong> ${data?.date || ""}</p>
          <p style="color: #991b1b; margin: 10px 0 0 0;"><strong>Cancelado por:</strong> ${data?.cancelledBy || "Participante"}</p>
          ${data?.reason && data.reason !== "Não informado" ? `<p style="color: #991b1b; margin: 10px 0 0 0;"><strong>Motivo:</strong> ${data.reason}</p>` : ''}
        </div>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          ${data?.userRole === "mentor" 
            ? "Você pode agendar uma nova sessão com outro mentor disponível na plataforma." 
            : "Aguarde o contato para reagendamento ou verifique sua agenda."}
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/dashboard" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Acessar Plataforma
          </a>
        </div>
        ${emailFooter}
      </div>
    `,
  },
  session_rescheduled: {
    subject: "Sua mentoria foi remarcada 📅",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.warning}; text-align: center;">Mentoria Remarcada 📅</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}. Sua mentoria foi remarcada para uma nova data.
        </p>
        <div style="background-color: ${MOVE_COLORS.accent}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.warning};">
          <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>Data anterior:</strong> <s>${data?.oldDate || ""}</s></p>
          <p style="color: ${MOVE_COLORS.success}; margin: 10px 0 0 0; font-size: 18px;"><strong>Nova data:</strong> ${data?.newDate || ""}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Remarcado por:</strong> ${data?.rescheduledBy || "Participante"}</p>
          ${data?.reason && data.reason !== "Não informado" ? `<p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Motivo:</strong> ${data.reason}</p>` : ''}
        </div>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.secondary};">
          <p style="color: ${MOVE_COLORS.secondary}; font-size: 14px; margin: 0;">
            <strong>📌 Importante:</strong> A sessão precisará ser confirmada novamente. ${data?.userRole === "mentee" ? "O mentor entrará em contato para confirmar os detalhes." : "Entre em contato com o mentorado para confirmar."}
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/dashboard" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Acessar Plataforma
          </a>
        </div>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  content_approved: {
    subject: "Seu conteúdo foi aprovado! 🎉",
    isTransactional: false,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.success}; text-align: center;">Conteúdo Aprovado! 🎉</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Seu conteúdo "<strong style="color: ${MOVE_COLORS.primary};">${data?.title || ""}</strong>" foi aprovado e já está disponível para a comunidade.
        </p>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Obrigado por contribuir com a Movê! Sua dedicação ajuda a transformar vidas.
        </p>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  content_rejected: {
    subject: "Atualização sobre seu conteúdo",
    isTransactional: false,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.warning}; text-align: center;">Conteúdo Precisa de Ajustes</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}. Analisamos seu conteúdo "<strong>${data?.title || ""}</strong>" e infelizmente ele não atendeu aos nossos critérios no momento.
        </p>
        ${data?.reason ? `<p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;"><strong>Motivo:</strong> ${data.reason}</p>` : ""}
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.success}; text-align: center;">Bem-vindo à equipe de Mentores! 🌟</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Parabéns! Sua candidatura como mentor foi aprovada!
        </p>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Seu perfil de mentor já está ativo na plataforma e você pode começar a receber agendamentos de mentorias.
        </p>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Agora você pode:
        </p>
        <ul style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.8;">
          <li>🗓️ Gerenciar sua disponibilidade</li>
          <li>👥 Receber e confirmar agendamentos de mentorias</li>
          <li>💬 Ajudar pessoas em sua jornada profissional</li>
          <li>📚 Se você também quiser agendar mentorias como mentorado, pode fazer isso na área de mentores!</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/dashboard" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Acessar Painel de Mentor
          </a>
        </div>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  mentor_application_received: {
    subject: "Recebemos sua inscrição como Mentor! 🎯",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Obrigado por se inscrever! 🎯</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Recebemos sua inscrição como mentor na Movê.
        </p>
        <div style="background-color: ${MOVE_COLORS.accent}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
          <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>Área de atuação:</strong> ${data?.area || "N/A"}</p>
        </div>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          <strong>O que acontece agora?</strong>
        </p>
        <ul style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.8;">
          <li>📋 Nossa equipe vai analisar sua inscrição</li>
          <li>✅ Quando aprovado, seu perfil será criado automaticamente</li>
          <li>📧 Você receberá um e-mail confirmando a aprovação</li>
          <li>🚀 Aí é só acessar e começar a transformar vidas!</li>
        </ul>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Obrigado por querer fazer parte dessa missão de conectar pessoas e transformar trajetórias profissionais!
        </p>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  session_request_mentor: {
    subject: "Novo pedido de mentoria! 🎯",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Novo Pedido de Mentoria! 🎯</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Você recebeu um novo pedido de mentoria.
        </p>
        <div style="background-color: ${MOVE_COLORS.accent}; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.primary};">
          <p style="color: ${MOVE_COLORS.text}; margin: 0;"><strong>Mentorado:</strong> ${data?.menteeName || "Usuário"}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Data solicitada:</strong> ${data?.date || "A confirmar"}</p>
          <p style="color: ${MOVE_COLORS.text}; margin: 10px 0 0 0;"><strong>Duração:</strong> ${data?.duration || "30 min"}</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.secondary};">
          <p style="color: ${MOVE_COLORS.secondary}; font-size: 14px; margin: 0; font-weight: bold;">📚 Sobre o mentorado:</p>
          <p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 10px 0 0 0;"><strong>Formação:</strong> ${data?.formation || "Não informado"}</p>
          <p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 10px 0 0 0;"><strong>Objetivo da mentoria:</strong></p>
          <p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 5px 0 0 0; padding: 10px; background-color: white; border-radius: 8px; font-style: italic;">
            "${data?.objective || "Não informado"}"
          </p>
        </div>

        <div style="background-color: #fff7ed; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid ${MOVE_COLORS.warning};">
          <p style="color: ${MOVE_COLORS.primaryDark}; font-size: 14px; margin: 0; font-weight: bold;">📌 Ação necessária:</p>
          <p style="color: ${MOVE_COLORS.text}; font-size: 14px; margin: 10px 0 0 0;">
            Acesse a plataforma para <strong>confirmar ou recusar</strong> este pedido. 
            Após confirmado, você receberá os dados de contato do mentorado para combinar os detalhes da sessão.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/dashboard#mentorship-section" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Ver Pedido
          </a>
        </div>
        <p style="color: ${MOVE_COLORS.textMuted}; font-size: 14px; text-align: center; margin-top: 20px;">
          Obrigado por dedicar seu tempo para ajudar alguém em sua jornada profissional! 🧡
        </p>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  session_review_request: {
    subject: "Sua mentoria aconteceu! Que tal avaliar? ⭐",
    isTransactional: true,
    html: (name, data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.primary}; text-align: center;">Sua mentoria aconteceu! 🎉</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}! Que bom que sua mentoria com <strong style="color: ${MOVE_COLORS.primary};">${data?.mentorName || "seu mentor"}</strong> foi realizada!
        </p>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Que tal deixar um feedback sobre essa experiência? Seu comentário ajuda outros jovens a encontrarem o mentor ideal e também reconhece o trabalho voluntário de quem te ajudou. 💜
        </p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://movecarreiras.org/dashboard#mentorship-section" 
             style="background: linear-gradient(135deg, ${MOVE_COLORS.primary} 0%, #fb923c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
            Avaliar mentoria ⭐
          </a>
        </div>
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
  },
  mentee_reconfirmed: {
    subject: "✅ Mentorado confirmou presença na mentoria",
    html: (name: string, data?: Record<string, string>) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbf7;">
        <h1 style="color: ${MOVE_COLORS.success}; text-align: center;">✅ Presença confirmada!</h1>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          Olá, ${name}!
        </p>
        <p style="color: ${MOVE_COLORS.text}; font-size: 16px; line-height: 1.6;">
          O mentorado <strong style="color: ${MOVE_COLORS.primary};">${data?.menteeName || "seu mentorado"}</strong> confirmou presença para a mentoria de hoje às <strong>${data?.sessionTime || ""}</strong>.
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
        ${founderSignature}
        ${emailFooter}
      </div>
    `,
    isTransactional: true,
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

    console.log(`Processing email request: type=${type}, to=${to}, name=${name}`);

    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Template '${type}' not found`);
    }

    // Use verified custom domain
    const fromEmail = "Movê <noreply@movecarreiras.org>";

    // Handle mentee_reconfirmed - fetch session data and notify mentor
    if (type === "mentee_reconfirmed" && data?.sessionId) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      const { data: session } = await supabase
        .from("mentor_sessions")
        .select("*, mentors(name, email)")
        .eq("id", data.sessionId)
        .maybeSingle();

      if (!session) {
        return new Response(JSON.stringify({ success: false, error: "Session not found" }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const mentorName = (session.mentors as any)?.name || "Mentor";
      const mentorEmail = (session.mentors as any)?.email;
      if (!mentorEmail) {
        return new Response(JSON.stringify({ success: false, error: "Mentor email not found" }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get mentee name
      const { data: menteeProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", session.user_id)
        .maybeSingle();
      const menteeName = menteeProfile?.name || "Mentorado";

      const scheduledAt = new Date(session.scheduled_at);
      const sessionTime = scheduledAt.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
      });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: fromEmail,
          to: [mentorEmail],
          subject: template.subject,
          html: template.html(mentorName, { menteeName, sessionTime }),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Resend API error:", errorData);
        throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
      }

      const emailResponse = await res.json();
      console.log("Reconfirmation notification sent to mentor:", mentorEmail);
      return new Response(JSON.stringify(emailResponse), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle admin notification emails - send to all admins
    if (type === "new_user_admin_notification") {
      const adminEmails = await getAdminEmails();
      console.log("Sending admin notification to:", adminEmails);
      
      if (adminEmails.length === 0) {
        console.log("No admin emails found, skipping admin notification");
        return new Response(JSON.stringify({ 
          success: true, 
          skipped: true,
          reason: "No admin emails configured" 
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const results = [];
      for (const adminEmail of adminEmails) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [adminEmail],
              subject: template.subject,
              html: template.html(name, data),
            }),
          });

          if (res.ok) {
            const emailResponse = await res.json();
            console.log(`Admin notification sent to ${adminEmail}:`, emailResponse);
            results.push({ email: adminEmail, success: true });
          } else {
            const errorData = await res.json();
            console.error(`Failed to send admin notification to ${adminEmail}:`, errorData);
            results.push({ email: adminEmail, success: false, error: errorData });
          }
        } catch (err) {
          console.error(`Error sending to ${adminEmail}:`, err);
          results.push({ email: adminEmail, success: false, error: String(err) });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
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
      console.error("Resend API error:", errorData);
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully to", to, ":", emailResponse);

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