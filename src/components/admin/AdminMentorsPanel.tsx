import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, User, Loader2, ChevronDown, ChevronUp, Briefcase, GraduationCap, Clock, Calendar, Linkedin } from "lucide-react";
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
  linkedin_url: string | null;
  status: "pending" | "approved" | "rejected";
  disclaimer_accepted: boolean;
  created_at: string;
  anos_experiencia: number | null;
  availability: any;
  sessions_completed_count: number;
  temporarily_unavailable: boolean;
}

const dayLabels: Record<string, string> = {
  monday: "Segunda", tuesday: "Terça", wednesday: "Quarta",
  thursday: "Quinta", friday: "Sexta", saturday: "Sábado", sunday: "Domingo",
};

const AdminMentorsPanel = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

    if (status === "approved") {
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: mentor.email,
            name: mentor.name,
            type: "mentor_approved",
            skipPreferenceCheck: true,
          },
        });
      } catch (emailError) {
        console.error("Error sending mentor approval email:", emailError);
      }

      try {
        const { data: roleAdded, error: roleError } = await supabase
          .rpc("add_volunteer_role_by_email", { mentor_email: mentor.email });

        if (roleError) {
          console.error("Error adding volunteer role:", roleError);
        } else if (roleAdded) {
          console.log("Volunteer role added for existing user with email:", mentor.email);
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

  const formatAvailability = (availability: any) => {
    if (!Array.isArray(availability) || availability.length === 0) return "Não informada";
    return availability.map((a: any) => {
      const day = dayLabels[a.day] || a.day;
      const times = Array.isArray(a.times) ? a.times.join(", ") : "";
      return `${day}: ${times}`;
    });
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
          {mentors.map((mentor) => {
            const isExpanded = expandedId === mentor.id;
            return (
              <div
                key={mentor.id}
                className="bg-card border rounded-xl overflow-hidden"
              >
                {/* Summary row */}
                <div
                  className="p-4 flex flex-col md:flex-row gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : mentor.id)}
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
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-sm text-primary font-medium">{mentor.area}</p>
                      {mentor.anos_experiencia != null && (
                        <span className="text-xs text-muted-foreground">• {mentor.anos_experiencia} anos exp.</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={(e) => { e.stopPropagation(); updateMentorStatus(mentor, "approved"); }}
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
                        onClick={(e) => { e.stopPropagation(); updateMentorStatus(mentor, "rejected"); }}
                        disabled={updating === mentor.id || mentor.status === "rejected"}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            Cargo | Empresa
                          </div>
                          <p className="text-sm font-medium">{mentor.area}</p>
                        </div>

                        {mentor.anos_experiencia != null && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                              <Clock className="w-3.5 h-3.5" />
                              Anos de Experiência
                            </div>
                            <p className="text-sm">{mentor.anos_experiencia} anos</p>
                          </div>
                        )}

                        {mentor.education && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              Formação
                            </div>
                            <p className="text-sm">{mentor.education}</p>
                          </div>
                        )}

                        {mentor.linkedin_url && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                              <Linkedin className="w-3.5 h-3.5" />
                              LinkedIn
                            </div>
                            <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                              {mentor.linkedin_url}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Disponibilidade
                          </div>
                          <div className="space-y-1">
                            {(() => {
                              const avail = formatAvailability(mentor.availability);
                              if (typeof avail === "string") return <p className="text-sm text-muted-foreground">{avail}</p>;
                              return avail.map((line, i) => (
                                <p key={i} className="text-sm">{line}</p>
                              ));
                            })()}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Data da inscrição</p>
                          <p className="text-sm">
                            {new Date(mentor.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Sessões realizadas</p>
                          <p className="text-sm font-medium">{mentor.sessions_completed_count}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Sobre</p>
                      <p className="text-sm whitespace-pre-wrap">{mentor.description}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMentorsPanel;