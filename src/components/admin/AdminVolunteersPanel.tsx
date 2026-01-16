import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Briefcase, Check, X, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  area: string;
  how_to_help: string;
  categories: string[] | null;
  submitted_at: string;
  status: string;
  user_id: string | null;
}

const categoryLabels: Record<string, string> = {
  aulas_lives: "Aulas/Lives",
  templates_arquivos: "Templates/Arquivos",
  mentoria: "Mentoria",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
};

const AdminVolunteersPanel = () => {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("volunteer_applications")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar aplicações");
      console.error(error);
    } else {
      setApplications((data || []) as VolunteerApplication[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleApprove = async (app: VolunteerApplication) => {
    setProcessingId(app.id);

    try {
      // Update application status
      const { error: updateError } = await supabase
        .from("volunteer_applications")
        .update({ status: "aprovado" })
        .eq("id", app.id);

      if (updateError) throw updateError;

      // Check if this volunteer also applied as a mentor (has mentoria category)
      const isMentorApplication = app.categories?.includes("mentoria") || app.how_to_help.toLowerCase().includes("mentoria");
      
      if (isMentorApplication) {
        // Also approve the mentor record if it exists
        const { error: mentorUpdateError } = await supabase
          .from("mentors")
          .update({ status: "approved" })
          .eq("email", app.email);

        if (mentorUpdateError) {
          console.error("Error updating mentor status:", mentorUpdateError);
        }
      }

      // Find user by email and add volunteer role
      const { data: userData } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", app.user_id)
        .maybeSingle();

      if (userData?.user_id) {
        // Add volunteer role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: userData.user_id, role: "voluntario" as any })
          .select();

        if (roleError && !roleError.message.includes("duplicate")) {
          console.error("Error adding role:", roleError);
        }

        // Create notification for the user
        await supabase.from("notifications").insert({
          user_id: userData.user_id,
          title: "Parabéns! Você foi aprovado como voluntário! 🎉",
          message: isMentorApplication 
            ? "Agora você tem acesso às funcionalidades de voluntário e mentor. Acesse seu dashboard para começar."
            : "Agora você tem acesso às funcionalidades de voluntário. Acesse seu dashboard para começar.",
          type: "volunteer_approval",
        });
      }

      toast.success(`${app.name} foi aprovado como voluntário${isMentorApplication ? ' e mentor' : ''}!`);
      fetchApplications();
    } catch (error: any) {
      toast.error("Erro ao aprovar: " + error.message);
    }

    setProcessingId(null);
  };

  const handleReject = async (app: VolunteerApplication) => {
    setProcessingId(app.id);

    try {
      const { error } = await supabase
        .from("volunteer_applications")
        .update({ status: "rejeitado" })
        .eq("id", app.id);

      if (error) throw error;

      toast.success(`Aplicação de ${app.name} foi rejeitada`);
      fetchApplications();
    } catch (error: any) {
      toast.error("Erro ao rejeitar: " + error.message);
    }

    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingApplications = applications.filter(a => a.status === "pendente");
  const processedApplications = applications.filter(a => a.status !== "pendente");

  return (
    <div className="space-y-6">
      {/* Pending Applications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Pendentes ({pendingApplications.length})
        </h3>

        {pendingApplications.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 bg-muted/50 rounded-xl">
            Nenhuma aplicação pendente
          </p>
        ) : (
          <div className="space-y-3">
            {pendingApplications.map((app) => (
              <div
                key={app.id}
                className="bg-card border border-amber-200 rounded-xl p-4"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="font-semibold">{app.name}</h4>
                  <Badge variant="outline">{formatDate(app.submitted_at)}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${app.email}`} className="hover:underline">
                      {app.email}
                    </a>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span>{app.area}</span>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Categorias:</p>
                    <div className="flex flex-wrap gap-1">
                      {app.categories?.map((cat, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {categoryLabels[cat] || cat}
                        </Badge>
                      )) || (
                        app.how_to_help.split(",").map((help, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {help.trim()}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(app)}
                      disabled={processingId === app.id}
                      className="flex-1"
                    >
                      {processingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(app)}
                      disabled={processingId === app.id}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Applications */}
      {processedApplications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Processados ({processedApplications.length})
          </h3>

          <div className="space-y-3">
            {processedApplications.map((app) => (
              <div
                key={app.id}
                className="bg-card border rounded-xl p-4 opacity-75"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="font-semibold">{app.name}</h4>
                  <Badge variant={statusLabels[app.status]?.variant || "outline"}>
                    {statusLabels[app.status]?.label || app.status}
                  </Badge>
                  <Badge variant="outline">{formatDate(app.submitted_at)}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{app.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span>{app.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVolunteersPanel;
