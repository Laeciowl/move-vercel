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

  const updateMentorStatus = async (mentorId: string, status: "approved" | "rejected") => {
    setUpdating(mentorId);
    const { error } = await supabase
      .from("mentors")
      .update({ status })
      .eq("id", mentorId);

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    } else {
      toast.success(`Mentor ${status === "approved" ? "aprovado" : "rejeitado"} com sucesso`);
      fetchMentors();
    }
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
                  onClick={() => updateMentorStatus(mentor.id, "approved")}
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
                  onClick={() => updateMentorStatus(mentor.id, "rejected")}
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
