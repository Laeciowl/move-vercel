import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find completed sessions that don't have a review yet
    // Only sessions completed more than 24h ago to give time
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get completed sessions from last 7 days
    const { data: completedSessions, error: sessionsErr } = await supabase
      .from("mentor_sessions")
      .select("id, user_id, mentor_id, completed_at")
      .eq("status", "completed")
      .not("completed_at", "is", null)
      .lte("completed_at", oneDayAgo)
      .gte("completed_at", sevenDaysAgo);

    if (sessionsErr) {
      console.error("Error fetching sessions:", sessionsErr);
      return new Response(JSON.stringify({ error: sessionsErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!completedSessions || completedSessions.length === 0) {
      return new Response(JSON.stringify({ message: "No sessions to process", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionIds = completedSessions.map(s => s.id);

    // Get existing reviews
    const { data: existingReviews } = await supabase
      .from("session_reviews")
      .select("session_id")
      .in("session_id", sessionIds);

    const reviewedSessionIds = new Set((existingReviews || []).map(r => r.session_id));

    // Filter to sessions without reviews
    const unreviewedSessions = completedSessions.filter(s => !reviewedSessionIds.has(s.id));

    if (unreviewedSessions.length === 0) {
      return new Response(JSON.stringify({ message: "All sessions already reviewed", sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if we already sent a notification for these sessions (avoid duplicates)
    // We check notifications table for existing review reminders
    const userIds = [...new Set(unreviewedSessions.map(s => s.user_id))];
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("user_id, message")
      .in("user_id", userIds)
      .eq("type", "review_reminder");

    const usersAlreadyNotified = new Set(
      (existingNotifications || []).map(n => n.user_id)
    );

    // Get mentor names
    const mentorIds = [...new Set(unreviewedSessions.map(s => s.mentor_id))];
    const { data: mentors } = await supabase
      .from("mentors")
      .select("id, name")
      .in("id", mentorIds);
    const mentorNameMap = new Map((mentors || []).map(m => [m.id, m.name]));

    // Get mentee profiles and emails
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email_notifications")
      .in("user_id", userIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // Get emails from auth
    const { data: authData } = await supabase.auth.admin.listUsers();
    const emailMap = new Map(
      (authData?.users || []).map(u => [u.id, u.email])
    );

    let sentCount = 0;

    for (const session of unreviewedSessions) {
      const userId = session.user_id;
      
      // Skip if already notified
      if (usersAlreadyNotified.has(userId)) continue;

      const profile = profileMap.get(userId);
      const mentorName = mentorNameMap.get(session.mentor_id) || "seu mentor";
      const email = emailMap.get(userId);

      // Create in-app notification (using service role bypasses RLS)
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Avalie sua mentoria! ⭐",
        message: `Sua mentoria com ${mentorName} foi realizada! Avalie a experiência para ajudar outros mentorados.`,
        type: "review_reminder",
      });

      // Send email if user has notifications enabled
      if (email && profile?.email_notifications !== false) {
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/send-notification-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              to: email,
              name: profile?.name || "Mentorado",
              type: "session_review_request",
              skipPreferenceCheck: true,
              data: {
                mentorName,
              },
            }),
          });
        } catch (err) {
          console.error(`Error sending review email to ${email}:`, err);
        }
      }

      usersAlreadyNotified.add(userId);
      sentCount++;
    }

    return new Response(
      JSON.stringify({ message: `Review reminders sent`, sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in send-review-reminders:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
