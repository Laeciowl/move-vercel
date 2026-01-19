import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    console.log(`Deleting user account: ${userId} (${userEmail})`);

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Delete user data in order (respecting foreign keys)
    
    // 1. Delete notifications
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    
    // 2. Delete mentor sessions where user is mentee
    await supabaseAdmin.from("mentor_sessions").delete().eq("user_id", userId);
    
    // 3. Delete impact history
    await supabaseAdmin.from("impact_history").delete().eq("user_id", userId);
    
    // 4. Delete bug reports
    await supabaseAdmin.from("bug_reports").delete().eq("user_id", userId);
    
    // 5. Delete user roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    
    // 6. Delete profile
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    // 7. If user is a mentor, delete mentor-related data
    const { data: mentor } = await supabaseAdmin
      .from("mentors")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (mentor) {
      // Delete mentor blocked periods
      await supabaseAdmin.from("mentor_blocked_periods").delete().eq("mentor_id", mentor.id);
      
      // Delete mentor sessions where user is mentor
      await supabaseAdmin.from("mentor_sessions").delete().eq("mentor_id", mentor.id);
      
      // Delete mentor
      await supabaseAdmin.from("mentors").delete().eq("id", mentor.id);
    }

    // 8. If user has volunteer application
    const { data: volunteer } = await supabaseAdmin
      .from("volunteer_applications")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (volunteer) {
      // Delete volunteer submissions
      await supabaseAdmin.from("volunteer_submissions").delete().eq("volunteer_id", volunteer.id);
      
      // Delete volunteer application
      await supabaseAdmin.from("volunteer_applications").delete().eq("id", volunteer.id);
    }

    // 9. Delete profile photos from storage
    try {
      const { data: files } = await supabaseAdmin.storage
        .from("profile-photos")
        .list(userId);

      if (files && files.length > 0) {
        const filesToDelete = files.map((f) => `${userId}/${f.name}`);
        await supabaseAdmin.storage.from("profile-photos").remove(filesToDelete);
      }
    } catch (storageErr) {
      console.log("Error deleting storage files:", storageErr);
    }

    // 10. Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Erro ao deletar conta: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted user account: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Conta deletada com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Error deleting user account:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno: " + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});