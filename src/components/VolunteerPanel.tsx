import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, FileText, Video, Plus, Loader2, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Submission {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  content_url: string;
  status: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  aulas_lives: "Aulas/Lives",
  templates_arquivos: "Templates/Arquivos",
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: "Pendente", icon: <Clock className="w-3 h-3" />, className: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprovado", icon: <CheckCircle className="w-3 h-3" />, className: "bg-green-100 text-green-700" },
  rejected: { label: "Rejeitado", icon: <XCircle className="w-3 h-3" />, className: "bg-red-100 text-red-700" },
};

const VolunteerPanel = () => {
  const { user } = useAuth();
  const { isVolunteer, loading: checkingVolunteer } = useVolunteerCheck();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || !isVolunteer) {
      setLoading(false);
      return;
    }
    fetchSubmissions();
  }, [user?.email, isVolunteer]);

  const fetchSubmissions = async () => {
    if (!user?.email) return;

    const { data, error } = await supabase
      .from("volunteer_submissions")
      .select("*")
      .eq("volunteer_email", user.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions:", error);
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  if (checkingVolunteer || loading) {
    return null;
  }

  if (!isVolunteer) {
    return null;
  }

  const approvedSubmissions = submissions.filter(s => s.status === "approved");
  const pendingSubmissions = submissions.filter(s => s.status === "pending");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Painel do Voluntário</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie suas contribuições
            </p>
          </div>
        </div>
        <Badge variant="default" className="bg-primary">
          Voluntário
        </Badge>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-accent/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{approvedSubmissions.length}</div>
          <div className="text-xs text-muted-foreground">Aprovados</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{pendingSubmissions.length}</div>
          <div className="text-xs text-muted-foreground">Pendentes</div>
        </div>
      </div>

      {/* Submit new content */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Enviar novo conteúdo</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/voluntario")}
            className="flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            Aula/Live
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/voluntario")}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Template
          </Button>
        </div>
      </div>

      {/* Recent submissions */}
      {submissions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Suas submissões</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {submissions.slice(0, 5).map((submission) => {
              const status = statusConfig[submission.status] || statusConfig.pending;
              return (
                <div
                  key={submission.id}
                  className="flex items-start justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {submission.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[submission.category] || submission.category}
                      </Badge>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                  </div>
                  {submission.status === "approved" && (
                    <a
                      href={submission.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VolunteerPanel;
