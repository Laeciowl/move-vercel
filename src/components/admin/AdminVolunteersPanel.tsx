import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Briefcase, Check, X, Clock, User } from "lucide-react";
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

interface MentorInfo {
  id: string;
  status: "pending" | "approved" | "rejected";
  photo_url: string | null;
  description: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  aprovado: { label: "Aprovado", variant: "default" },
  rejeitado: { label: "Rejeitado", variant: "destructive" },
};

const AdminVolunteersPanel = () => {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [mentorsByEmail, setMentorsByEmail] = useState<Record<string, MentorInfo>>({});
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
      
      // Buscar informações de mentor para cada email
      const emails = (data || []).map((app: VolunteerApplication) => app.email);
      if (emails.length > 0) {
        const { data: mentorsData } = await supabase
          .from("mentors")
          .select("id, email, status, photo_url, description")
          .in("email", emails);
        
        if (mentorsData) {
          const mentorsMap: Record<string, MentorInfo> = {};
          mentorsData.forEach((m: any) => {
            mentorsMap[m.email] = {
              id: m.id,
              status: m.status,
              photo_url: m.photo_url,
              description: m.description,
            };
          });
          setMentorsByEmail(mentorsMap);
        }
      }
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

      // Verificar se já existe um mentor com este email
      const { data: existingMentor } = await supabase
        .from("mentors")
        .select("id")
        .eq("email", app.email)
        .maybeSingle();

      if (existingMentor) {
        // Atualizar o mentor existente para approved
        const { error: mentorUpdateError } = await supabase
          .from("mentors")
          .update({ status: "approved" })
          .eq("id", existingMentor.id);

        if (mentorUpdateError) {
          console.error("Error updating mentor status:", mentorUpdateError);
        }
      } else {
        // Criar novo registro de mentor como aprovado
        const { error: mentorInsertError } = await supabase
          .from("mentors")
          .insert({
            name: app.name,
            email: app.email,
            area: app.area,
            description: `Voluntário aprovado - ${app.how_to_help}`,
            availability: [],
            status: "approved",
            disclaimer_accepted: true,
            disclaimer_accepted_at: new Date().toISOString(),
          });

        if (mentorInsertError) {
          console.error("Error creating mentor:", mentorInsertError);
        }
      }

      // Add volunteer role and update profile photo if user_id exists
      if (app.user_id) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: app.user_id, role: "voluntario" as any })
          .select();

        if (roleError && !roleError.message.includes("duplicate")) {
          console.error("Error adding role:", roleError);
        }

        // Update profile photo from mentor photo if available
        const mentor = mentorsByEmail[app.email];
        if (mentor?.photo_url) {
          const { error: photoError } = await supabase
            .from("profiles")
            .update({ photo_url: mentor.photo_url })
            .eq("user_id", app.user_id);

          if (photoError) {
            console.error("Error updating profile photo:", photoError);
          }
        }

        // Create notification for the user
        await supabase.from("notifications").insert({
          user_id: app.user_id,
          title: "Parabéns! Você foi aprovado como voluntário! 🎉",
          message: "Agora você pode oferecer mentorias e contribuir com conteúdos. Acesse seu dashboard para começar!",
          type: "volunteer_approval",
        });
      }

      // Send approval email
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: app.email,
            name: app.name,
            type: "volunteer_approved",
            skipPreferenceCheck: true, // Transactional email - always send
          },
        });
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
        // Don't fail the approval if email fails
      }

      toast.success(`${app.name} foi aprovado como voluntário!`);
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

      // Também rejeitar o mentor se existir
      const mentor = mentorsByEmail[app.email];
      if (mentor) {
        await supabase
          .from("mentors")
          .update({ status: "rejected" })
          .eq("id", mentor.id);
      }

      toast.success(`Aplicação de ${app.name} foi rejeitada`);
      fetchApplications();
    } catch (error: any) {
      toast.error("Erro ao rejeitar: " + error.message);
    }

    setProcessingId(null);
  };

  const getMentorStatusBadge = (email: string) => {
    const mentor = mentorsByEmail[email];
    if (!mentor) return null;

    switch (mentor.status) {
      case "approved":
        return <Badge className="bg-green-500 text-white">Mentor Ativo</Badge>;
      case "rejected":
        return <Badge variant="destructive">Mentor Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Mentor Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingApplications = applications.filter(a => a.status === "pendente");
  const approvedApplications = applications.filter(a => a.status === "aprovado");
  const rejectedApplications = applications.filter(a => a.status === "rejeitado");

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
                  {mentorsByEmail[app.email]?.photo_url ? (
                    <img
                      src={mentorsByEmail[app.email].photo_url!}
                      alt={app.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <h4 className="font-semibold">{app.name}</h4>
                  <Badge variant="outline">{formatDate(app.submitted_at)}</Badge>
                  {getMentorStatusBadge(app.email)}
                  {app.user_id && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Conta Criada
                    </Badge>
                  )}
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

                  {mentorsByEmail[app.email]?.description && (
                    <p className="text-muted-foreground mt-2 line-clamp-2">
                      {mentorsByEmail[app.email].description}
                    </p>
                  )}

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

      {/* Approved Applications */}
      {approvedApplications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Aprovados ({approvedApplications.length})
          </h3>

          <div className="space-y-3">
            {approvedApplications.map((app) => (
              <div
                key={app.id}
                className="bg-card border border-green-200 rounded-xl p-4"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {mentorsByEmail[app.email]?.photo_url ? (
                    <img
                      src={mentorsByEmail[app.email].photo_url!}
                      alt={app.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <h4 className="font-semibold">{app.name}</h4>
                  <Badge variant="default">Aprovado</Badge>
                  {getMentorStatusBadge(app.email)}
                  {app.user_id ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Conta Ativa
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      Sem Conta
                    </Badge>
                  )}
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

      {/* Rejected Applications */}
      {rejectedApplications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">
            Rejeitados ({rejectedApplications.length})
          </h3>

          <div className="space-y-3">
            {rejectedApplications.map((app) => (
              <div
                key={app.id}
                className="bg-card border rounded-xl p-4 opacity-60"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="font-semibold">{app.name}</h4>
                  <Badge variant="destructive">Rejeitado</Badge>
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
