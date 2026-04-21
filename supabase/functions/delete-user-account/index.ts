import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("User error:", userError);
      return new Response(
        JSON.stringify({ error: "Token inválido ou usuário não encontrado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    console.log(`Deleting user account: ${userId} (${userEmail})`);

    const logDeleteError = (table: string, err: { message?: string } | null) => {
      if (err?.message) console.error(`Delete from ${table}:`, err.message);
    };

    // Referrals (no FK to auth — clean up explicitly)
    await supabaseAdmin.from("referrals").delete().eq("referrer_id", userId).then(({ error }) =>
      logDeleteError("referrals referrer_id", error)
    );
    await supabaseAdmin.from("referrals").delete().eq("referred_user_id", userId).then(({ error }) =>
      logDeleteError("referrals referred_user_id", error)
    );

    await supabaseAdmin.from("onboarding_quiz_attempts").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("onboarding_quiz_attempts", error)
    );
    await supabaseAdmin.from("nps_respostas").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("nps_respostas", error)
    );
    await supabaseAdmin.from("mentee_interests").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("mentee_interests", error)
    );
    await supabaseAdmin.from("mentee_penalties").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("mentee_penalties", error)
    );
    await supabaseAdmin.from("user_achievements").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("user_achievements", error)
    );
    await supabaseAdmin.from("content_access_log").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("content_access_log", error)
    );
    await supabaseAdmin.from("content_saves").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("content_saves", error)
    );
    await supabaseAdmin.from("google_calendar_tokens").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("google_calendar_tokens", error)
    );
    await supabaseAdmin.from("mentor_mentee_notes").delete().eq("mentee_user_id", userId).then(({ error }) =>
      logDeleteError("mentor_mentee_notes", error)
    );

    // Development plans (plano_itens CASCADE from planos_desenvolvimento)
    await supabaseAdmin.from("planos_desenvolvimento").delete().eq("mentorado_id", userId).then(({ error }) =>
      logDeleteError("planos_desenvolvimento", error)
    );
    await supabaseAdmin.from("progresso_passo").delete().eq("mentorado_id", userId).then(({ error }) =>
      logDeleteError("progresso_passo", error)
    );
    await supabaseAdmin.from("progresso_trilha").delete().eq("mentorado_id", userId).then(({ error }) =>
      logDeleteError("progresso_trilha", error)
    );

    await supabaseAdmin.from("session_reviews").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("session_reviews user_id", error)
    );
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("notifications", error)
    );
    await supabaseAdmin.from("mentor_sessions").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("mentor_sessions mentee", error)
    );
    await supabaseAdmin.from("impact_history").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("impact_history", error)
    );
    await supabaseAdmin.from("bug_reports").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("bug_reports", error)
    );
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("user_roles", error)
    );
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId).then(({ error }) =>
      logDeleteError("profiles", error)
    );

    if (userEmail) {
      const { data: mentor } = await supabaseAdmin
        .from("mentors")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();

      if (mentor) {
        await supabaseAdmin.from("session_reviews").delete().eq("mentor_id", mentor.id).then(({ error }) =>
          logDeleteError("session_reviews mentor_id", error)
        );
        await supabaseAdmin.from("mentor_blocked_periods").delete().eq("mentor_id", mentor.id).then(({ error }) =>
          logDeleteError("mentor_blocked_periods", error)
        );
        await supabaseAdmin.from("mentor_sessions").delete().eq("mentor_id", mentor.id).then(({ error }) =>
          logDeleteError("mentor_sessions mentor", error)
        );
        await supabaseAdmin.from("mentors").delete().eq("id", mentor.id).then(({ error }) =>
          logDeleteError("mentors", error)
        );
      }
    }

    const { data: volunteerRows } = await supabaseAdmin
      .from("volunteer_applications")
      .select("id")
      .eq("user_id", userId);

    for (const row of volunteerRows ?? []) {
      await supabaseAdmin.from("volunteer_submissions").delete().eq("volunteer_id", row.id).then(({ error }) =>
        logDeleteError("volunteer_submissions", error)
      );
      await supabaseAdmin.from("volunteer_applications").delete().eq("id", row.id).then(({ error }) =>
        logDeleteError("volunteer_applications", error)
      );
    }

    try {
      const { data: files } = await supabaseAdmin.storage.from("profile-photos").list(userId);
      if (files && files.length > 0) {
        const filesToDelete = files.map((f) => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from("profile-photos").remove(filesToDelete);
      }
    } catch (storageErr) {
      console.log("Error deleting profile-photos:", storageErr);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Erro ao deletar conta: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Successfully deleted user account: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Conta deletada com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error deleting user account:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno: " + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
