import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Ban, Loader2, UserX, Undo2, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PenaltyRecord {
  id: string;
  user_id: string;
  total_no_shows: number;
  total_completed: number;
  status: string;
  blocked_until: string | null;
  block_reason: string | null;
  updated_at: string;
  profile_name?: string;
  profile_photo?: string | null;
}

const statusLabels: Record<string, string> = {
  ativo: "Ativo",
  aviso_1: "⚠️ 1ª falta",
  bloqueado_7d: "🚫 Bloqueado 7 dias",
  bloqueado_30d: "🚫 Bloqueado 30 dias",
  banido: "⛔ Banido",
};

const statusColors: Record<string, string> = {
  ativo: "bg-green-100 text-green-700",
  aviso_1: "bg-yellow-100 text-yellow-700",
  bloqueado_7d: "bg-red-100 text-red-700",
  bloqueado_30d: "bg-red-200 text-red-800",
  banido: "bg-gray-200 text-gray-800",
};

const AdminNoShowPanel = () => {
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, noShows: 0, rate: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch penalties
    const { data: penaltiesData } = await supabase
      .from("mentee_penalties")
      .select("*")
      .order("total_no_shows", { ascending: false });

    // Calculate stats from penalties data (same source as the list)
    const allPenalties = penaltiesData || [];
    const totalNoShows = allPenalties.reduce((sum, p) => sum + (p.total_no_shows || 0), 0);
    const totalCompleted = allPenalties.reduce((sum, p) => sum + (p.total_completed || 0), 0);
    const totalSessions = totalNoShows + totalCompleted;
    setStats({
      total: totalSessions,
      noShows: totalNoShows,
      rate: totalSessions > 0 ? Math.round(((totalCompleted) / totalSessions) * 100 * 10) / 10 : 100,
    });

    setLoading(false);
  };

  const handleForgive = async (penaltyId: string) => {
    setUpdating(penaltyId);
    const { error } = await supabase
      .from("mentee_penalties")
      .update({
        total_no_shows: 0,
        status: "ativo",
        blocked_until: null,
        block_reason: "Perdoado por administrador",
        updated_at: new Date().toISOString(),
      })
      .eq("id", penaltyId);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success("Faltas perdoadas com sucesso!");
      fetchData();
    }
    setUpdating(null);
  };

  const handleBan = async (penaltyId: string) => {
    setUpdating(penaltyId);
    const { error } = await supabase
      .from("mentee_penalties")
      .update({
        status: "banido",
        blocked_until: null,
        block_reason: "Banido manualmente por administrador",
        updated_at: new Date().toISOString(),
      })
      .eq("id", penaltyId);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success("Usuário banido de agendamentos");
      fetchData();
    }
    setUpdating(null);
  };

  const handleUnblock = async (penaltyId: string) => {
    setUpdating(penaltyId);
    const { error } = await supabase
      .from("mentee_penalties")
      .update({
        status: "ativo",
        blocked_until: null,
        block_reason: "Desbloqueado por administrador",
        updated_at: new Date().toISOString(),
      })
      .eq("id", penaltyId);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success("Usuário desbloqueado!");
      fetchData();
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Filter out users with 0 no-shows and active status (forgiven/clean records)
  const relevantPenalties = penalties.filter(p => p.total_no_shows > 0 || p.status !== "ativo");
  const critical = relevantPenalties.filter(p => p.total_no_shows >= 3);
  const warning = relevantPenalties.filter(p => p.total_no_shows === 2);

  const filteredPenalties = relevantPenalties.filter(p =>
    !search || (p.profile_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const renderUserRow = (p: PenaltyRecord, showActions = true) => (
    <div key={p.id} className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
          {p.profile_photo ? (
            <img src={p.profile_photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{p.profile_name}</p>
          <p className="text-xs text-muted-foreground">
            {p.total_completed} realizadas · {p.total_no_shows} falta{p.total_no_shows !== 1 ? "s" : ""}
            {p.blocked_until && ` · Bloqueado até ${format(new Date(p.blocked_until), "dd/MM/yyyy", { locale: ptBR })}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[p.status] || "bg-muted text-foreground"}`}>
          {statusLabels[p.status] || p.status}
        </span>
        {showActions && (
          <>
            {p.total_no_shows > 0 && p.status !== "banido" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleForgive(p.id)}
                disabled={updating === p.id}
                className="h-7 text-xs"
              >
                {updating === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3 mr-1" />}
                Perdoar
              </Button>
            )}
            {(p.status === "bloqueado_7d" || p.status === "bloqueado_30d" || p.status === "banido") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnblock(p.id)}
                disabled={updating === p.id}
                className="h-7 text-xs"
              >
                {updating === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Desbloquear"}
              </Button>
            )}
            {p.status !== "banido" && p.total_no_shows >= 3 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBan(p.id)}
                disabled={updating === p.id}
                className="h-7 text-xs"
              >
                <Ban className="w-3 h-3 mr-1" />
                Banir
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <UserX className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Controle de No-Shows</h3>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total reportados</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.noShows}</p>
          <p className="text-xs text-muted-foreground">No-shows</p>
        </div>
        <div className={`rounded-xl p-4 text-center ${stats.rate >= 95 ? "bg-green-50 dark:bg-green-900/20" : stats.rate >= 85 ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
          <p className={`text-2xl font-bold ${stats.rate >= 95 ? "text-green-600" : stats.rate >= 85 ? "text-yellow-600" : "text-red-600"}`}>
            {stats.rate}%
          </p>
          <p className="text-xs text-muted-foreground">Taxa comparecimento</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{critical.length}</p>
          <p className="text-xs text-muted-foreground">Críticos (3+ faltas)</p>
        </div>
      </div>

      {/* Alerts */}
      {critical.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 space-y-1">
          <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            🔴 CRÍTICOS ({critical.length})
          </p>
          {critical.map(p => renderUserRow(p))}
        </div>
      )}

      {warning.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 space-y-1">
          <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            🟡 ATENÇÃO ({warning.length})
          </p>
          {warning.map(p => renderUserRow(p, false))}
        </div>
      )}

      {/* Search and full list */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar mentorado..."
            className="pl-9"
          />
        </div>

        {filteredPenalties.length > 0 ? (
          <div className="space-y-2">
            {filteredPenalties.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border/50 rounded-xl p-4"
              >
                {renderUserRow(p)}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? "Nenhum resultado encontrado" : "Nenhum registro de penalidade ainda"}
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminNoShowPanel;
