import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  area: string;
  how_to_help: string;
  submitted_at: string;
}

const AdminVolunteersPanel = () => {
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from("volunteer_applications")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar aplicações");
      console.error(error);
    } else {
      setApplications(data || []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Aplicações de Voluntários ({applications.length})
      </h3>

      {applications.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhuma aplicação de voluntário
        </p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-card border rounded-xl p-4"
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
                  <p className="text-xs text-muted-foreground mb-1">Como quer ajudar:</p>
                  <div className="flex flex-wrap gap-1">
                    {app.how_to_help.split(",").map((help, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {help.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVolunteersPanel;
