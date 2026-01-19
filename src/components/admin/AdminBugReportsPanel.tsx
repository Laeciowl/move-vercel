import { useState, useEffect } from "react";
import { Bug, CheckCircle, Clock, MessageSquare, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BugReport {
  id: string;
  user_name: string;
  user_email: string;
  title: string;
  description: string;
  page_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: { label: "Pendente", icon: <Clock className="w-3 h-3" />, className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "Em análise", icon: <MessageSquare className="w-3 h-3" />, className: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resolvido", icon: <CheckCircle className="w-3 h-3" />, className: "bg-green-100 text-green-700" },
};

const AdminBugReportsPanel = () => {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar relatórios: " + error.message);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    setUpdating(reportId);

    const updateData: any = { status: newStatus };
    if (newStatus === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }
    if (adminNotes) {
      updateData.admin_notes = adminNotes;
    }

    const { error } = await supabase
      .from("bug_reports")
      .update(updateData)
      .eq("id", reportId);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success("Pronto, atualizado!");
      fetchReports();
      setSelectedReport(null);
      setAdminNotes("");
    }
    setUpdating(null);
  };

  const filteredReports = filterStatus === "all" 
    ? reports 
    : reports.filter(r => r.status === filterStatus);

  const pendingCount = reports.filter(r => r.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
            <Bug className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Relatórios de Erros</h2>
            <p className="text-sm text-muted-foreground">
              {pendingCount > 0 ? `${pendingCount} pendente${pendingCount > 1 ? 's' : ''}` : 'Todos resolvidos'}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "pending", "in_progress", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {status === "all" ? "Todos" : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Reports list */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <Bug className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum relatório encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const status = statusConfig[report.status] || statusConfig.pending;
            return (
              <div
                key={report.id}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{report.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>👤 {report.user_name}</span>
                  <span>📧 {report.user_email}</span>
                  <span>📅 {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  {report.page_url && (
                    <a
                      href={report.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver página
                    </a>
                  )}
                </div>

                {report.admin_notes && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Notas do admin:</p>
                    <p className="text-sm text-foreground">{report.admin_notes}</p>
                  </div>
                )}

                {report.status !== "resolved" && (
                  <div className="flex gap-2 pt-2">
                    {report.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(report.id, "in_progress")}
                        disabled={updating === report.id}
                      >
                        {updating === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Marcar em análise"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      disabled={updating === report.id}
                    >
                      Resolver
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolve Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Resolver relatório</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione uma nota sobre a resolução (opcional):
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] mb-4"
              placeholder="Ex: Corrigido na versão 1.2..."
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedReport(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => updateStatus(selectedReport.id, "resolved")}
                disabled={updating === selectedReport.id}
                className="flex-1"
              >
                {updating === selectedReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Marcar como resolvido"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBugReportsPanel;
