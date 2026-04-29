import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  Loader2,
  UserX,
  Undo2,
  Search,
  User,
  ChevronDown,
  Calendar,
  History,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface NoShowEvent {
  id: string;
  mentee_user_id: string;
  reported_at: string | null;
  mentor_observations: string | null;
  mentee_avisou: boolean | null;
  session_id: string;
  mentor_sessions: { scheduled_at: string; status: string } | null;
  mentors: { name: string; area: string } | null;
}

interface PenaltyRecord {
  id: string;
  user_id: string;
  total_no_shows: number;
  total_completed: number;
  status: string;
  blocked_until: string | null;
  block_reason: string | null;
  updated_at: string;
  last_forgiven_at: string | null;
  last_forgiven_by: string | null;
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
  ativo: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  aviso_1: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200",
  bloqueado_7d: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  bloqueado_30d: "bg-red-200 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  banido: "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const AdminNoShowPanel = () => {
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [historyByUserId, setHistoryByUserId] = useState<Map<string, NoShowEvent[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, noShows: 0, rate: 0 });
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const { data: penaltiesData, error: penaltiesError } = await supabase
      .from("mentee_penalties")
      .select("*")
      .order("total_no_shows", { ascending: false });

    if (penaltiesError) {
      toast.error("Erro ao carregar penalidades: " + penaltiesError.message);
      setLoading(false);
      return;
    }

    const allPenalties = penaltiesData || [];
    const userIds = [...new Set(allPenalties.map((p) => p.user_id))];

    const profileByUserId = new Map<string, { name: string; photo_url: string | null }>();
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, name, photo_url")
        .in("user_id", userIds);
      profilesData?.forEach((row) => {
        profileByUserId.set(row.user_id, { name: row.name, photo_url: row.photo_url });
      });
    }

    const enriched: PenaltyRecord[] = allPenalties.map((p) => {
      const prof = profileByUserId.get(p.user_id);
      return {
        id: p.id,
        user_id: p.user_id,
        total_no_shows: p.total_no_shows ?? 0,
        total_completed: p.total_completed ?? 0,
        status: p.status ?? "ativo",
        blocked_until: p.blocked_until,
        block_reason: p.block_reason,
        updated_at: p.updated_at ?? "",
        last_forgiven_at: p.last_forgiven_at ?? null,
        last_forgiven_by: p.last_forgiven_by ?? null,
        profile_name: prof?.name ?? "Mentorado (perfil indisponível)",
        profile_photo: prof?.photo_url ?? null,
      };
    });

    setPenalties(enriched);

    const totalNoShows = enriched.reduce((sum, p) => sum + p.total_no_shows, 0);
    const totalCompleted = enriched.reduce((sum, p) => sum + p.total_completed, 0);
    const totalSessions = totalNoShows + totalCompleted;
    setStats({
      total: totalSessions,
      noShows: totalNoShows,
      rate: totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100 * 10) / 10 : 100,
    });

    if (userIds.length > 0) {
      const { data: attRows, error: attErr } = await supabase
        .from("mentee_attendance")
        .select("id, mentee_user_id, reported_at, mentor_observations, mentee_avisou, session_id, mentor_id")
        .in("mentee_user_id", userIds)
        .eq("status", "no_show_mentorado")
        .order("reported_at", { ascending: false });

      if (!attErr && attRows && attRows.length > 0) {
        const mentorIds = [...new Set(attRows.map((r) => r.mentor_id))];
        const sessionIds = [...new Set(attRows.map((r) => r.session_id))];

        const [mentorsRes, sessionsRes] = await Promise.all([
          supabase.from("mentors").select("id, name, area").in("id", mentorIds),
          supabase.from("mentor_sessions").select("id, scheduled_at, status").in("id", sessionIds),
        ]);

        const mentorMap = new Map((mentorsRes.data || []).map((m) => [m.id, m]));
        const sessionMap = new Map((sessionsRes.data || []).map((s) => [s.id, s]));

        const map = new Map<string, NoShowEvent[]>();
        for (const row of attRows) {
          const sess = sessionMap.get(row.session_id);
          const ment = mentorMap.get(row.mentor_id);
          const ev: NoShowEvent = {
            id: row.id,
            mentee_user_id: row.mentee_user_id,
            reported_at: row.reported_at,
            mentor_observations: row.mentor_observations,
            mentee_avisou: row.mentee_avisou,
            session_id: row.session_id,
            mentor_sessions: sess
              ? { scheduled_at: sess.scheduled_at, status: sess.status as string }
              : null,
            mentors: ment ? { name: ment.name, area: ment.area ?? "" } : null,
          };
          const uid = row.mentee_user_id;
          if (!map.has(uid)) map.set(uid, []);
          map.get(uid)!.push(ev);
        }
        setHistoryByUserId(map);
      } else {
        setHistoryByUserId(new Map());
      }
    } else {
      setHistoryByUserId(new Map());
    }

    setLoading(false);
  };

  const handleForgive = async (penaltyId: string) => {
    setUpdating(penaltyId);
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("mentee_penalties")
      .update({
        total_no_shows: 0,
        status: "ativo",
        blocked_until: null,
        block_reason: "Perdoado por administrador",
        last_forgiven_at: new Date().toISOString(),
        last_forgiven_by: adminUser?.id ?? null,
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

  const relevantPenalties = penalties.filter(
    (p) =>
      p.total_no_shows > 0 ||
      p.status !== "ativo" ||
      (p.last_forgiven_at != null && p.last_forgiven_at.length > 0) ||
      (p.block_reason?.toLowerCase().includes("perdoado") ?? false),
  );

  const critical = relevantPenalties.filter((p) => p.total_no_shows >= 3);
  const warning = relevantPenalties.filter((p) => p.total_no_shows === 2);

  const filteredPenalties = relevantPenalties.filter(
    (p) => !search || (p.profile_name?.toLowerCase().includes(search.toLowerCase()) ?? false),
  );

  const renderHistory = (userId: string) => {
    const events = historyByUserId.get(userId) || [];
    if (events.length === 0) {
      return (
        <p className="text-xs text-muted-foreground py-2">
          Nenhum registro detalhado em <code className="text-[10px]">mentee_attendance</code> (no-show).
          Pode ser dado migrado ou inconsistência — conferir sessão no banco.
        </p>
      );
    }
    return (
      <ul className="space-y-2 pt-1">
        {events.map((ev) => {
          const when = ev.mentor_sessions?.scheduled_at
            ? format(new Date(ev.mentor_sessions.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            : "—";
          const mentor = ev.mentors?.name ?? "Mentor (id " + ev.session_id.slice(0, 8) + "…)";
          const area = ev.mentors?.area ? ` · ${ev.mentors.area}` : "";
          const obs = ev.mentor_observations?.trim();
          return (
            <li
              key={ev.id}
              className="text-xs border border-border/60 rounded-lg p-2.5 bg-muted/20 space-y-1"
            >
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {when}
              </p>
              <p>
                <span className="text-muted-foreground">Mentor:</span>{" "}
                <span className="font-medium">{mentor}</span>
                <span className="text-muted-foreground">{area}</span>
              </p>
              <p className="text-muted-foreground">
                Registrado em:{" "}
                {ev.reported_at
                  ? format(new Date(ev.reported_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : "—"}{" "}
                · Avisou antes? {ev.mentee_avisou ? "sim" : "não"}
              </p>
              {obs ? <p className="text-foreground/90 italic">&quot;{obs}&quot;</p> : null}
            </li>
          );
        })}
      </ul>
    );
  };

  const renderForgivenessNote = (p: PenaltyRecord) => {
    if (p.last_forgiven_at) {
      return (
        <div className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg px-2 py-1.5 mt-2 border border-green-200/60 dark:border-green-800/50">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            <strong>Perdão administrativo:</strong>{" "}
            {format(new Date(p.last_forgiven_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {p.last_forgiven_by ? ` · admin id ${p.last_forgiven_by.slice(0, 8)}…` : ""}. Contador de
            faltas foi zerado naquele momento; novas faltas voltam a contar.
          </span>
        </div>
      );
    }
    if (p.total_no_shows === 0 && p.block_reason?.toLowerCase().includes("perdoado")) {
      return (
        <p className="text-xs text-muted-foreground mt-2">
          Situação atual compatível com perdão antigo (sem data rastreada no banco).
        </p>
      );
    }
    return null;
  };

  const renderUserCard = (p: PenaltyRecord, showActions = true) => {
    const isOpen = openRows.has(p.id);
    return (
      <motion.div
        key={p.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-card border border-border/50 rounded-xl overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
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
                <p className="text-xs text-muted-foreground font-mono truncate" title={p.user_id}>
                  {p.user_id}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.total_completed} realizadas · {p.total_no_shows} falta{p.total_no_shows !== 1 ? "s" : ""}{" "}
                  registrada{p.total_no_shows !== 1 ? "s" : ""} no contador
                  {p.blocked_until &&
                    new Date(p.blocked_until) > new Date() &&
                    ` · Bloqueado até ${format(new Date(p.blocked_until), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
                </p>
                {p.block_reason && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    Motivo / nota: {p.block_reason}
                  </p>
                )}
                {renderForgivenessNote(p)}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusColors[p.status] || "bg-muted text-foreground"}`}
              >
                {statusLabels[p.status] || p.status}
              </span>
              {showActions && (
                <div className="flex flex-wrap justify-end gap-1">
                  {p.total_no_shows > 0 && p.status !== "banido" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleForgive(p.id)}
                      disabled={updating === p.id}
                      className="h-7 text-xs"
                    >
                      {updating === p.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Undo2 className="w-3 h-3 mr-1" />
                      )}
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
                </div>
              )}
            </div>
          </div>

          <Collapsible
            open={isOpen}
            onOpenChange={(open) => {
              setOpenRows((prev) => {
                const next = new Set(prev);
                if (open) next.add(p.id);
                else next.delete(p.id);
                return next;
              });
            }}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full mt-3 h-8 text-xs gap-1 text-muted-foreground">
                <History className="w-3.5 h-3.5" />
                Histórico de faltas (mentoria / mentor)
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-border/40 mt-2 pt-2">
              {renderHistory(p.user_id)}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </motion.div>
    );
  };

  const renderUserRowCompact = (p: PenaltyRecord, showActions = true) => (
    <div key={p.id} className="py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{p.profile_name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{p.total_no_shows} falta(s)</span>
        </div>
        {showActions && p.total_no_shows > 0 && p.status !== "banido" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleForgive(p.id)}
            disabled={updating === p.id}
            className="h-7 text-xs shrink-0"
          >
            Perdoar
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <UserX className="w-5 h-5 text-destructive" />
        <div>
          <h3 className="text-lg font-bold text-foreground">Controle de No-Shows</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cada falta listada abaixo mostra data da mentoria, mentor e observações. Perdões administrativos ficam
            registrados com data (e admin) após usar &quot;Perdoar&quot;.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total reportados (contador)</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.noShows}</p>
          <p className="text-xs text-muted-foreground">No-shows (soma contadores)</p>
        </div>
        <div
          className={`rounded-xl p-4 text-center ${stats.rate >= 95 ? "bg-green-50 dark:bg-green-900/20" : stats.rate >= 85 ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-red-50 dark:bg-red-900/20"}`}
        >
          <p
            className={`text-2xl font-bold ${stats.rate >= 95 ? "text-green-600" : stats.rate >= 85 ? "text-yellow-600" : "text-red-600"}`}
          >
            {stats.rate}%
          </p>
          <p className="text-xs text-muted-foreground">Taxa comparecimento (agregado)</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{critical.length}</p>
          <p className="text-xs text-muted-foreground">Críticos (3+ faltas)</p>
        </div>
      </div>

      {critical.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            CRÍTICOS ({critical.length})
          </p>
          {critical.map((p) => renderUserRowCompact(p))}
        </div>
      )}

      {warning.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 space-y-2">
          <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            ATENÇÃO — 2 faltas ({warning.length})
          </p>
          {warning.map((p) => renderUserRowCompact(p, false))}
        </div>
      )}

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
          <div className="space-y-3">
            {filteredPenalties.map((p) => renderUserCard(p))}
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
