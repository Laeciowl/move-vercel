import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Mentor {
  id: string;
  name: string;
  email: string;
  area: string;
  description: string;
  education: string | null;
  photo_url: string | null;
  status: "pending" | "approved" | "rejected";
  disclaimer_accepted: boolean;
  created_at: string;
}

const AdminMentorsPanel = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchMentors = async () => {
    const { data, error } = await supabase
      .from("mentors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar mentores");
      console.error(error);
    } else {
      setMentors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const updateMentorStatus = async (mentor: Mentor, status: "approved" | "rejected") => {
    setUpdating(mentor.id);
    
    const { error } = await supabase
      .from("mentors")
      .update({ status })
      .eq("id", mentor.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
      setUpdating(null);
      return;
    }

    // If approved, send email notification and add volunteer role if user exists
    if (status === "approved") {
      // Send approval email
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: mentor.email,
            name: mentor.name,
            type: "mentor_approved",
            skipPreferenceCheck: true,
          },
        });
        console.log("Mentor approval email sent to:", mentor.email);
      } catch (emailError) {
        console.error("Error sending mentor approval email:", emailError);
      }

      // Try to find user by email and add volunteer role
      try {
        // Check if user exists with this email by querying profiles
        const { data: authData } = await supabase.auth.admin?.listUsers?.() || { data: null };
        
        // Alternative approach: Check if mentor email exists as a user by looking up profiles
        // We can't directly query auth.users, but we can try to find if there's a matching profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id")
          .limit(1);
        
        // Since we can't query auth.users directly from client, we'll rely on the mentor 
        // having created an account during the volunteer flow. If they exist, add the role.
        // The email matching happens on the backend.
        
        // Check if there's already a voluntario role for a user with this email
        // by looking for volunteer_applications with this email that have a user_id
        const { data: volunteerApp } = await supabase
          .from("volunteer_applications")
          .select("user_id")
          .eq("email", mentor.email)
          .not("user_id", "is", null)
          .maybeSingle();

        if (volunteerApp?.user_id) {
          // Add voluntario role if not already present
          const { error: roleError } = await supabase
            .from("user_roles")
            .upsert(
              { user_id: volunteerApp.user_id, role: "voluntario" },
              { onConflict: "user_id,role", ignoreDuplicates: true }
            );

          if (roleError && !roleError.message.includes("duplicate")) {
            console.error("Error adding volunteer role:", roleError);
          } else {
            console.log("Volunteer role added for user:", volunteerApp.user_id);
          }
        }
      } catch (roleError) {
        console.error("Error processing volunteer role:", roleError);
      }
      
      toast.success("Mentor aprovado! E-mail de confirmação enviado. 🎉");
    } else {
      toast.success("Mentor não aprovado.");
    }
    
    fetchMentors();
    setUpdating(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Mentores ({mentors.length})</h3>
      
      {mentors.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum mentor cadastrado</p>
      ) : (
        <div className="space-y-4">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="bg-card border rounded-xl p-4 flex flex-col md:flex-row gap-4"
            >
              <div className="flex-shrink-0">
                {mentor.photo_url ? (
                  <img
                    src={mentor.photo_url}
                    alt={mentor.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-semibold">{mentor.name}</h4>
                  {getStatusBadge(mentor.status)}
                  {mentor.disclaimer_accepted && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Disclaimer aceito
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{mentor.email}</p>
                <p className="text-sm text-primary">{mentor.area}</p>
                {mentor.education && (
                  <p className="text-sm text-muted-foreground mt-1">{mentor.education}</p>
                )}
                <p className="text-sm mt-2 line-clamp-2">{mentor.description}</p>
              </div>

              <div className="flex gap-2 md:flex-col">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                  onClick={() => updateMentorStatus(mentor, "approved")}
                  disabled={updating === mentor.id || mentor.status === "approved"}
                >
                  {updating === mentor.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => updateMentorStatus(mentor, "rejected")}
                  disabled={updating === mentor.id || mentor.status === "rejected"}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMentorsPanel;
