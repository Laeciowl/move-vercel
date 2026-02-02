import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user from token using admin client
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("User error:", userError);
      return new Response(
        JSON.stringify({ error: "Token inválido ou usuário não encontrado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    console.log(`Deleting user account: ${userId} (${userEmail})`);

    // Delete user data in order (respecting foreign keys)
    
    // 1. Delete session reviews
    await supabaseAdmin.from("session_reviews").delete().eq("user_id", userId);
    
    // 2. Delete notifications
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    
    // 3. Delete mentor sessions where user is mentee
    await supabaseAdmin.from("mentor_sessions").delete().eq("user_id", userId);
    
    // 4. Delete impact history
    await supabaseAdmin.from("impact_history").delete().eq("user_id", userId);
    
    // 5. Delete bug reports
    await supabaseAdmin.from("bug_reports").delete().eq("user_id", userId);
    
    // 6. Delete user roles
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    
    // 7. Delete profile
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    // 8. If user is a mentor, delete mentor-related data
    if (userEmail) {
      const { data: mentor } = await supabaseAdmin
        .from("mentors")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();

      if (mentor) {
        // Delete session reviews for this mentor
        await supabaseAdmin.from("session_reviews").delete().eq("mentor_id", mentor.id);
        
        // Delete mentor blocked periods
        await supabaseAdmin.from("mentor_blocked_periods").delete().eq("mentor_id", mentor.id);
        
        // Delete mentor sessions where user is mentor
        await supabaseAdmin.from("mentor_sessions").delete().eq("mentor_id", mentor.id);
        
        // Delete mentor
        await supabaseAdmin.from("mentors").delete().eq("id", mentor.id);
      }
    }

    // 9. If user has volunteer application
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

    // 10. Delete profile photos from storage
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

    // 11. Finally, delete the auth user
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
