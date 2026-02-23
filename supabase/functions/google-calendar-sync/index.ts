import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const ORCHESTRATOR_EMAIL = "movecarreiras@gmail.com";

async function getValidToken(adminClient: any, userId: string): Promise<string | null> {
  const { data: tokenRow } = await adminClient
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!tokenRow) return null;

  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return tokenRow.access_token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenRow.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (data.error) {
    console.error("Token refresh failed for user", userId, ":", data);
    return null;
  }

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await adminClient
    .from("google_calendar_tokens")
    .update({ access_token: data.access_token, expires_at: newExpiresAt })
    .eq("user_id", userId);

  return data.access_token;
}

async function getOrchestratorToken(adminClient: any): Promise<string | null> {
  // Find the orchestrator user by google_email
  const { data: tokenRow } = await adminClient
    .from("google_calendar_tokens")
    .select("*")
    .eq("google_email", ORCHESTRATOR_EMAIL)
    .maybeSingle();

  if (!tokenRow) {
    console.error("Orchestrator account not found:", ORCHESTRATOR_EMAIL);
    return null;
  }

  return getValidToken(adminClient, tokenRow.user_id);
}

async function createCalendarEvent(accessToken: string, event: any): Promise<any> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );
  return res.json();
}

async function deleteCalendarEvent(accessToken: string, eventId: string): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // ACTION: create-event — create calendar event via orchestrator account
  if (action === "create-event") {
    const body = await req.json();
    const { session_id } = body;
    console.log("create-event: Starting for session", session_id);

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: corsHeaders });
    }

    // Get orchestrator token
    const orchestratorToken = await getOrchestratorToken(adminClient);
    if (!orchestratorToken) {
      return new Response(JSON.stringify({ error: "Orchestrator Google Calendar not connected" }), {
        status: 500, headers: corsHeaders,
      });
    }

    const { data: session } = await adminClient
      .from("mentor_sessions")
      .select("*, mentors(name, email)")
      .eq("id", session_id)
      .maybeSingle();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: menteeProfile } = await adminClient
      .from("profiles")
      .select("name")
      .eq("user_id", session.user_id)
      .maybeSingle();

    const mentorName = (session.mentors as any)?.name || "Mentor";
    const menteeName = menteeProfile?.name || "Mentorado";
    const mentorEmail = (session.mentors as any)?.email;
    const scheduledAt = new Date(session.scheduled_at);
    const durationMin = session.duration || 30;
    const endAt = new Date(scheduledAt.getTime() + durationMin * 60 * 1000);

    // Get mentee email
    let menteeEmail: string | null = null;
    const { data: menteeUser } = await adminClient.auth.admin.getUserById(session.user_id);
    if (menteeUser?.user) {
      menteeEmail = menteeUser.user.email || null;
    }

    console.log("create-event: Creating via orchestrator. Mentor:", mentorEmail, "Mentee:", menteeEmail);

    const scheduledDate = scheduledAt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
    const scheduledTime = scheduledAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

    const eventPayload = {
      summary: `Sua Mentoria Movê com o mentor ${mentorName} está confirmada!`,
      description: [
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🟣 MOVÊ — Mentoria de Carreira Gratuita`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `Olá, ${menteeName}! 👋`,
        ``,
        `Sua sessão de mentoria está confirmada:`,
        ``,
        `👤 Mentor(a): ${mentorName}`,
        `📅 Data: ${scheduledDate}`,
        `🕐 Horário: ${scheduledTime} (Brasília)`,
        `⏱️ Duração: ${durationMin} minutos`,
        ...(session.mentee_objective ? [`🎯 Objetivo: ${session.mentee_objective}`] : []),
        ``,
        `O link do Google Meet está disponível neste evento.`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dicas para sua mentoria:`,
        `• Prepare suas dúvidas com antecedência`,
        `• Esteja no horário — pontualidade é respeito`,
        `• Após a sessão, avalie seu mentor na plataforma`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `🌐 Acesse a plataforma: https://movesocial.lovable.app`,
        `📧 Dúvidas? movecarreiras@gmail.com`,
        ``,
        `Movê — Conectando quem quer crescer com quem pode ajudar 💜`,
      ].join('\n'),
      start: { dateTime: scheduledAt.toISOString(), timeZone: "America/Sao_Paulo" },
      end: { dateTime: endAt.toISOString(), timeZone: "America/Sao_Paulo" },
      attendees: [
        ...(mentorEmail ? [{ email: mentorEmail }] : []),
        ...(menteeEmail ? [{ email: menteeEmail }] : []),
      ],
      conferenceData: {
        createRequest: {
          requestId: `move-session-${session_id}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 1440 },
          { method: "popup", minutes: 30 },
        ],
      },
    };

    const res = await createCalendarEvent(orchestratorToken, eventPayload);
    console.log("Orchestrator calendar event response:", JSON.stringify(res));

    if (!res.id) {
      return new Response(JSON.stringify({ error: res.error?.message || "Failed to create event" }), {
        status: 500, headers: corsHeaders,
      });
    }

    // Extract Meet link
    const meetLink = res.hangoutLink || res.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri;

    // Save event ID and meet link
    const updateData: any = { google_calendar_event_id: res.id };
    if (meetLink) {
      updateData.meeting_link = meetLink;
      console.log("Meeting link saved:", meetLink);
    }

    await adminClient
      .from("mentor_sessions")
      .update(updateData)
      .eq("id", session_id);

    console.log("Saved calendar event ID:", res.id);

    return new Response(JSON.stringify({ 
      success: true, 
      results: { event_id: res.id, meetingLink: meetLink } 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ACTION: test — create a test event
  if (action === "test") {
    const userId = user.id;
    const token = await getValidToken(adminClient, userId);

    if (!token) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60 * 1000);
    const end = new Date(start.getTime() + 15 * 60 * 1000);

    const res = await createCalendarEvent(token, {
      summary: "Teste de sincronização - Movê",
      description: "Este é um teste de sincronização com o Google Calendar. Você pode deletar este evento.",
      start: { dateTime: start.toISOString(), timeZone: "America/Sao_Paulo" },
      end: { dateTime: end.toISOString(), timeZone: "America/Sao_Paulo" },
    });

    if (res.id) {
      return new Response(JSON.stringify({ success: true, event_id: res.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: res.error?.message || "Failed to create event" }), {
      status: 500, headers: corsHeaders,
    });
  }

  // ACTION: cancel-event — cancel calendar event via orchestrator
  if (action === "cancel-event") {
    const body = await req.json();
    const { session_id } = body;
    console.log("cancel-event: Starting for session", session_id);

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: corsHeaders });
    }

    const { data: session } = await adminClient
      .from("mentor_sessions")
      .select("google_calendar_event_id")
      .eq("id", session_id)
      .maybeSingle();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: corsHeaders });
    }

    const results: any = { deleted: false };

    if (session.google_calendar_event_id) {
      const orchestratorToken = await getOrchestratorToken(adminClient);
      if (orchestratorToken) {
        const ok = await deleteCalendarEvent(orchestratorToken, session.google_calendar_event_id);
        results.deleted = ok;
        console.log("cancel-event: Event delete:", ok ? "deleted" : "failed");
      } else {
        results.error = "orchestrator_not_connected";
        console.error("cancel-event: Orchestrator token not available");
      }

      // Clear event ID and meeting link
      await adminClient
        .from("mentor_sessions")
        .update({
          google_calendar_event_id: null,
          google_calendar_mentee_event_id: null,
        })
        .eq("id", session_id);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
});
