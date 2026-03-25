import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Search, Filter, Loader2, User, Clock, CheckCircle, XCircle, AlertTriangle, UserX, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  mentee_formation: string | null;
  mentor_notes: string | null;
}

interface AttendanceRecord {
  session_id: string;
  status: string;
  mentee_avisou: boolean | null;
  mentor_observations: string | null;
  reported_at: string | null;
}

const AdminMentorSessionsPanel = () => {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const [sessionsRes, attendanceRes] = await Promise.all([
      supabase
        .from("mentor_sessions_with_names")
        .select("*")
        .order("scheduled_at", { ascending: false })
        .limit(1000),
      supabase
        .from("mentee_attendance")
        .select("session_id, status, mentee_avisou, mentor_observations, reported_at")
        .limit(1000),
    ]);

    if (!sessionsRes.error && sessionsRes.data) {
      setSessions(sessionsRes.data as unknown as SessionRow[]);
    }

    if (!attendanceRes.error && attendanceRes.data) {
      const map: Record<string, AttendanceRecord> = {};
      for (const a of attendanceRes.data) {
        map[a.session_id] = a as AttendanceRecord;
      }
      setAttendanceMap(map);
    }

    setLoading(false);
  };

  const getSessionStatus = (session: SessionRow) => {
    if (session.status === "cancelled") return "cancelled";
    if (session.status === "completed") return "completed";
    const endTime = new Date(session.scheduled_at);
    endTime.setMinutes(endTime.getMinutes() + (session.duration || 30));
    if (isPast(endTime)) return "past_awaiting";
    return "upcoming";
  };

  // Derive a more detailed status combining session + attendance
  const getDetailedStatus = (session: SessionRow) => {
    const attendance = attendanceMap[session.id];
    if (attendance) {
      if (attendance.status === "no_show_mentorado") return "no_show_mentorado";
      if (attendance.status === "no_show_mentor") return "no_show_mentor";
      if (attendance.status === "reagendada") return "reagendada";
      if (attendance.status === "realizada") return "realizada";
    }
    return getSessionStatus(session);
  };

  const filteredSessions = sessions.filter((s) => {
    const status = statusFilter === "no_show_mentorado" || statusFilter === "no_show_mentor"
      ? getDetailedStatus(s)
      : getSessionStatus(s);
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

  const noShowMentorado = sessions.filter(s => getDetailedStatus(s) === "no_show_mentorado").length;
  const noShowMentor = sessions.filter(s => getDetailedStatus(s) === "no_show_mentor").length;

  const attendanceBadge = (session: SessionRow) => {
    const attendance = attendanceMap[session.id];
    if (!attendance) return null;

    switch (attendance.status) {
      case "no_show_mentorado":
        return (
          <Badge className="bg-red-600/10 text-red-700 border-red-600/20 text-xs font-semibold gap-1">
            <UserX className="w-3 h-3" />
            Mentorado faltou
            {attendance.mentee_avisou === false && (
              <span className="text-red-800 font-bold ml-1">• SEM AVISO</span>
            )}
            {attendance.mentee_avisou === true && (
              <span className="text-amber-600 ml-1">• avisou</span>
            )}
          </Badge>
        );
      case "no_show_mentor":
        return (
          <Badge className="bg-orange-600/10 text-orange-700 border-orange-600/20 text-xs font-semibold gap-1">
            <AlertTriangle className="w-3 h-3" />
            Mentor faltou
          </Badge>
        );
      case "reagendada":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs gap-1">
            🔄 Reagendada
          </Badge>
        );
      case "realizada":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs gap-1">
            <UserCheck className="w-3 h-3" />
            Confirmada pelo mentor
          </Badge>
        );
      default:
        return null;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Realizada</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs"><Clock className="w-3 h-3 mr-1" />Agendada</Badge>;
      case "past_awaiting":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs"><Clock className="w-3 h-3 mr-1" />Aguardando check</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs"><XCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === "completed").length,
    upcoming: sessions.filter(s => getSessionStatus(s) === "upcoming").length,
    pastAwaiting: sessions.filter(s => getSessionStatus(s) === "past_awaiting").length,
    cancelled: sessions.filter(s => s.status === "cancelled").length,
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <div className="bg-amber-500/5 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-amber-600">{stats.pastAwaiting}</div>
          <div className="text-xs text-muted-foreground">Aguardando check</div>
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
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="completed">Realizadas</SelectItem>
            <SelectItem value="upcoming">Agendadas</SelectItem>
            <SelectItem value="past_awaiting">Aguardando check</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
            <SelectItem value="no_show_mentorado">❌ Mentorado faltou</SelectItem>
            <SelectItem value="no_show_mentor">⚠️ Mentor faltou</SelectItem>
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
            const attendance = attendanceMap[session.id];
            const detailedStatus = getDetailedStatus(session);
            const isNoShow = detailedStatus === "no_show_mentorado" || detailedStatus === "no_show_mentor";

            return (
              <details
                key={session.id}
                className={`rounded-xl border overflow-hidden group ${
                  isNoShow
                    ? detailedStatus === "no_show_mentorado"
                      ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50"
                      : "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800/50"
                    : "bg-muted/20 border-border/30"
                }`}
              >
                <summary className="p-4 cursor-pointer list-none flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isNoShow
                        ? detailedStatus === "no_show_mentorado"
                          ? "bg-red-500/10"
                          : "bg-orange-500/10"
                        : "bg-primary/10"
                    }`}>
                      {detailedStatus === "no_show_mentorado" ? (
                        <UserX className="w-4 h-4 text-red-600" />
                      ) : detailedStatus === "no_show_mentor" ? (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      ) : (
                        <User className="w-4 h-4 text-primary" />
                      )}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Show attendance badge prominently */}
                    {attendanceBadge(session)}
                    {/* Show confirmation status */}
                    {!attendance && (
                      session.confirmed_by_mentor ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">✅ Aceita</Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">⏳ Pendente</Badge>
                      )
                    )}
                    {statusBadge(status)}
                  </div>
                </summary>
                <div className="px-4 pb-4 space-y-2 border-t border-border/20 pt-3">
                  {/* Attendance details - prominent section */}
                  {attendance && (
                    <div className={`rounded-lg p-3 space-y-1.5 ${
                      attendance.status === "no_show_mentorado"
                        ? "bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                        : attendance.status === "no_show_mentor"
                        ? "bg-orange-100/80 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"
                        : "bg-green-100/80 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                    }`}>
                      <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        📋 Relatório de comparecimento
                      </p>
                      <p className="text-sm text-foreground">
                        <strong>Status:</strong>{" "}
                        {attendance.status === "no_show_mentorado" && "❌ Mentorado não apareceu"}
                        {attendance.status === "no_show_mentor" && "⚠️ Mentor não compareceu"}
                        {attendance.status === "realizada" && "✅ Sessão realizada"}
                        {attendance.status === "reagendada" && "🔄 Sessão reagendada"}
                      </p>
                      {attendance.status === "no_show_mentorado" && (
                        <p className="text-sm text-foreground">
                          <strong>Avisou com antecedência?</strong>{" "}
                          {attendance.mentee_avisou === true
                            ? "🟡 Sim, avisou"
                            : attendance.mentee_avisou === false
                            ? "🔴 Não, faltou sem avisar (punição aplicada)"
                            : "Não informado"
                          }
                        </p>
                      )}
                      {attendance.mentor_observations && (
                        <p className="text-sm text-foreground">
                          <strong>Observações do mentor:</strong> "{attendance.mentor_observations}"
                        </p>
                      )}
                      {attendance.reported_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reportado em {format(new Date(attendance.reported_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}

                  {session.mentee_objective && (
                    <p className="text-sm text-muted-foreground">
                      🎯 <strong>Objetivo:</strong> {session.mentee_objective}
                    </p>
                  )}
                  {session.mentee_formation && (
                    <p className="text-sm text-muted-foreground">
                      🎓 <strong>Formação:</strong> {session.mentee_formation}
                    </p>
                  )}
                  {session.notes && (
                    <p className="text-sm text-muted-foreground">
                      📝 <strong>Notas:</strong> {session.notes}
                    </p>
                  )}
                  {session.mentor_notes && (
                    <p className="text-sm text-muted-foreground">
                      📋 <strong>Notas do mentor:</strong> {session.mentor_notes}
                    </p>
                  )}
                  {!attendance && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Confirmado: {session.confirmed_by_mentor ? "✅ Sim" : "⏳ Pendente"}</span>
                    </div>
                  )}
                </div>
              </details>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminMentorSessionsPanel;
