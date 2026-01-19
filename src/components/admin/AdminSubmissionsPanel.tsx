import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Loader2, Video, FileText, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Submission {
  id: string;
  volunteer_name: string;
  volunteer_email: string;
  category: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  area: string | null;
  tema: string | null;
}

const AdminSubmissionsPanel = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from("volunteer_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar submissões");
      console.error(error);
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const updateSubmissionStatus = async (submissionId: string, status: "approved" | "rejected") => {
    setUpdating(submissionId);
    
    const submission = submissions.find(s => s.id === submissionId);
    
    // If approved, add to content_items
    if (status === "approved" && submission) {
      const { error: contentError } = await supabase
        .from("content_items")
        .insert({
          title: submission.title,
          description: submission.description,
          url: submission.content_url,
          item_type: submission.content_type === "link" ? "video" : "pdf",
          category: submission.tema || "geral",
          area: submission.area || "geral",
        });

      if (contentError) {
        toast.error("Erro ao publicar conteúdo: " + contentError.message);
        setUpdating(null);
        return;
      }
    }

    const { error } = await supabase
      .from("volunteer_submissions")
      .update({ 
        status, 
        reviewed_at: new Date().toISOString() 
      })
      .eq("id", submissionId);

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    } else {
      toast.success(`Submissão ${status === "approved" ? "aprovada e publicada" : "rejeitada"} com sucesso`);
      fetchSubmissions();
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
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    if (category === "aulas_lives") {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Video className="w-3 h-3" /> Aula/Live
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <FileText className="w-3 h-3" /> Template
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === "pending");
  const reviewedSubmissions = submissions.filter(s => s.status !== "pending");

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Submissões de Conteúdo</h3>
      
      {/* Pending Submissions */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Pendentes ({pendingSubmissions.length})
        </h4>
        
        {pendingSubmissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
            Nenhuma submissão pendente
          </p>
        ) : (
          <div className="space-y-4">
            {pendingSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-card border rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {getCategoryBadge(submission.category)}
                  {getStatusBadge(submission.status)}
                </div>
                
                <div>
                  <h4 className="font-semibold text-foreground">{submission.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {submission.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Por: <span className="text-foreground">{submission.volunteer_name}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(submission.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>

                <a
                  href={submission.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver conteúdo
                </a>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => updateSubmissionStatus(submission.id, "approved")}
                    disabled={updating === submission.id}
                  >
                    {updating === submission.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Aprovar e Publicar
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => updateSubmissionStatus(submission.id, "rejected")}
                    disabled={updating === submission.id}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Submissions */}
      {reviewedSubmissions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Histórico ({reviewedSubmissions.length})
          </h4>
          <div className="space-y-3">
            {reviewedSubmissions.slice(0, 10).map((submission) => (
              <div
                key={submission.id}
                className="bg-muted/30 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  {getCategoryBadge(submission.category)}
                  <span className="font-medium text-sm">{submission.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(submission.status)}
                  <span className="text-xs text-muted-foreground">
                    {submission.reviewed_at && format(new Date(submission.reviewed_at), "dd/MM", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubmissionsPanel;