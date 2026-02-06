import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Search, Filter, Loader2, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionRow {
  id: string;
  scheduled_at: string;
  status: string;
  duration: number | null;
  mentor_id: string;
  user_id: string;
  mentor_name: string | null;
  mentee_name: string | null;
  confirmed_by_mentor: boolean | null;
  notes: string | null;
  mentee_objective: string | null;
}

const AdminMentorSessionsPanel = () => {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mentor_sessions_with_names")
      .select("*")
      .order("scheduled_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setSessions(data as unknown as SessionRow[]);
    }
    setLoading(false);
  };

  const getSessionStatus = (session: SessionRow) => {
    if (session.status === "cancelled") return "cancelled";
    const endTime = new Date(session.scheduled_at);
    endTime.setMinutes(endTime.getMinutes() + (session.duration || 30));
    if (isPast(endTime)) return "completed";
    return "upcoming";
  };

  const filteredSessions = sessions.filter((s) => {
    const status = getSessionStatus(s);
    if (statusFilter !== "all" && status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (s.mentor_name || "").toLowerCase().includes(q) ||
        (s.mentee_name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Realizada</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs"><Clock className="w-3 h-3 mr-1" />Agendada</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs"><XCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => getSessionStatus(s) === "completed").length,
    upcoming: sessions.filter(s => getSessionStatus(s) === "upcoming").length,
    cancelled: sessions.filter(s => getSessionStatus(s) === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Controle de Mentorias</h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-green-500/5 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-muted-foreground">Realizadas</div>
        </div>
        <div className="bg-blue-500/5 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{stats.upcoming}</div>
          <div className="text-xs text-muted-foreground">Agendadas</div>
        </div>
        <div className="bg-red-500/5 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-xs text-muted-foreground">Canceladas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por mentor ou mentorado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="completed">Realizadas</SelectItem>
            <SelectItem value="upcoming">Agendadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Session List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma mentoria encontrada</p>
        ) : (
          filteredSessions.map((session) => {
            const status = getSessionStatus(session);
            return (
              <div
                key={session.id}
                className="bg-muted/20 rounded-xl p-4 border border-border/30 space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {session.mentor_name || "Mentor"} → {session.mentee_name || "Mentorado"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        {" · "}{session.duration || 30} min
                      </p>
                    </div>
                  </div>
                  {statusBadge(status)}
                </div>
                {session.mentee_objective && (
                  <p className="text-xs text-muted-foreground pl-11 truncate">
                    🎯 {session.mentee_objective}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminMentorSessionsPanel;
