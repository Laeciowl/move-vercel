import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

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
    console.error("Token refresh failed:", data);
    await adminClient.from("google_calendar_tokens").delete().eq("user_id", userId);
    return null;
  }

  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await adminClient
    .from("google_calendar_tokens")
    .update({ access_token: data.access_token, expires_at: newExpiresAt })
    .eq("user_id", userId);

  return data.access_token;
}

async function createCalendarEvent(accessToken: string, event: any): Promise<any> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
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
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
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

  // ACTION: create-event — create calendar event for a confirmed session
  if (action === "create-event") {
    const body = await req.json();
    const { session_id } = body;
    console.log("create-event: Starting for session", session_id);

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: corsHeaders });
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

    // Get mentor user_id
    const { data: mentorUserIds } = await adminClient
      .rpc("get_mentor_user_ids", { mentor_ids: [session.mentor_id] });
    
    const mentorUserId = mentorUserIds?.[0]?.user_id || null;
    console.log("create-event: mentorUserId=", mentorUserId, "menteeUserId=", session.user_id);
    const mentorName = (session.mentors as any)?.name || "Mentor";
    const menteeName = menteeProfile?.name || "Mentorado";
    const scheduledAt = new Date(session.scheduled_at);
    const durationMin = session.duration || 30;
    const endAt = new Date(scheduledAt.getTime() + durationMin * 60 * 1000);

    // Get mentee email for attendee
    const mentorEmail = (session.mentors as any)?.email;
    let menteeEmail: string | null = null;
    const { data: menteeUser } = await adminClient.auth.admin.getUserById(session.user_id);
    if (menteeUser?.user) {
      menteeEmail = menteeUser.user.email || null;
    }

    const eventPayload = {
      summary: `Mentoria ${mentorName} ↔ ${menteeName} - Movê`,
      description: session.mentee_objective
        ? `Objetivo: ${session.mentee_objective}`
        : "Mentoria agendada pelo Movê",
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

    const results: any = { mentee: null, mentor: null, meetingLink: null };

    // Create for mentor first (to get Meet link)
    if (mentorUserId) {
      const mentorToken = await getValidToken(adminClient, mentorUserId);
      console.log("create-event: Mentor token found:", !!mentorToken);
      if (mentorToken) {
        const res = await createCalendarEvent(mentorToken, eventPayload);
        console.log("Mentor calendar event response:", JSON.stringify(res));
        if (res.id) {
          results.mentor = { event_id: res.id };
          // Extract Google Meet link
          const meetLink = res.hangoutLink || res.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri;
          if (meetLink) {
            results.meetingLink = meetLink;
            // Save meeting link to session
            await adminClient
              .from("mentor_sessions")
              .update({ meeting_link: meetLink })
              .eq("id", session_id);
            console.log("Meeting link saved:", meetLink);
          }
        } else {
          results.mentor = { error: res.error?.message };
        }
      }
    }

    // Create for mentee
    const menteeToken = await getValidToken(adminClient, session.user_id);
    console.log("create-event: Mentee token found:", !!menteeToken);
    if (menteeToken) {
      // If we already have a meet link, reuse it (don't create another)
      const menteeEventPayload = results.meetingLink
        ? { ...eventPayload, conferenceData: undefined }
        : eventPayload;
      
      const res = await createCalendarEvent(menteeToken, menteeEventPayload);
      console.log("Mentee calendar event response:", JSON.stringify(res));
      results.mentee = res.id ? { event_id: res.id } : { error: res.error?.message };
      
      // If mentor didn't have calendar but mentee did, get meet link from mentee's event
      if (!results.meetingLink && res.hangoutLink) {
        results.meetingLink = res.hangoutLink;
        await adminClient
          .from("mentor_sessions")
          .update({ meeting_link: res.hangoutLink })
          .eq("id", session_id);
        console.log("Meeting link saved from mentee event:", res.hangoutLink);
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
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

  return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
});
