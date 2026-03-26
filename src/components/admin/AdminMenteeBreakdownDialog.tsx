import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, CheckCircle, Clock, Search, ChevronDown, ChevronUp, X, Calendar, BookOpen } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SessionDetail {
  id: string;
  scheduled_at: string;
  status: string;
  completed_at: string | null;
  confirmed_by_mentor: boolean | null;
  mentor_name: string | null;
}

interface MenteeRow {
  user_id: string;
  name: string;
  photo_url: string | null;
  created_at: string;
  onboarding_quiz_passed: boolean;
  first_mentorship_booked: boolean;
  first_session_date: string | null;
  total_sessions: number;
  total_scheduled: number;
  total_cancelled: number;
  daysToFirst: number | null;
  status: "ativo" | "pendente" | "mentor";
  is_mentor: boolean;
  sessions: SessionDetail[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount: number;
  pendingCount: number;
}

const AdminMenteeBreakdownDialog = ({ open, onOpenChange, activeCount, pendingCount }: Props) => {
  const [mentees, setMentees] = useState<MenteeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "ativo" | "pendente" | "mentor">("all");
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchMentees = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, sessionsRes, mentorsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, name, photo_url, created_at, onboarding_quiz_passed, first_mentorship_booked"),
        supabase.from("mentor_sessions_with_names").select("id, user_id, scheduled_at, status, completed_at, confirmed_by_mentor, mentor_name"),
        supabase.from("mentors").select("id, status"),
      ]);

      const profiles = profilesRes.data || [];
      const sessions = sessionsRes.data || [];
      const approvedMentors = (mentorsRes.data || []).filter((m: any) => m.status === "approved");

      // Get user_ids for all approved mentors via RPC
      const mentorIds = approvedMentors.map((m: any) => m.id);
      const mentorUserIds = new Set<string>();
      if (mentorIds.length > 0) {
        for (let i = 0; i < mentorIds.length; i += 50) {
          const chunk = mentorIds.slice(i, i + 50);
          const { data } = await supabase.rpc("get_mentor_user_ids", { mentor_ids: chunk });
          if (data) data.forEach((d: any) => mentorUserIds.add(d.user_id));
        }
      }

      // Build per-user session stats and detail list
      const userSessionMap = new Map<string, {
        firstDate: string | null;
        completedCount: number;
        scheduledCount: number;
        cancelledCount: number;
        hasAny: boolean;
        sessions: SessionDetail[];
      }>();

      sessions.forEach((s: any) => {
        const existing = userSessionMap.get(s.user_id);
        const isCompleted = s.status === "completed" && s.completed_at;
        const detail: SessionDetail = {
          id: s.id,
          scheduled_at: s.scheduled_at,
          status: s.status,
          completed_at: s.completed_at,
          confirmed_by_mentor: s.confirmed_by_mentor,
          mentor_name: s.mentor_name,
        };

        if (!existing) {
          userSessionMap.set(s.user_id, {
            firstDate: isCompleted ? s.completed_at : null,
            completedCount: isCompleted ? 1 : 0,
            scheduledCount: s.status === "scheduled" ? 1 : 0,
            cancelledCount: s.status === "cancelled" ? 1 : 0,
            hasAny: true,
            sessions: [detail],
          });
        } else {
          existing.hasAny = true;
          existing.sessions.push(detail);
          if (s.status === "scheduled") existing.scheduledCount++;
          if (s.status === "cancelled") existing.cancelledCount++;
          if (isCompleted) {
            existing.completedCount++;
            if (!existing.firstDate || s.completed_at < existing.firstDate) {
              existing.firstDate = s.completed_at;
            }
          }
        }
      });

      const rows: MenteeRow[] = profiles.map((p: any) => {
        const sessionData = userSessionMap.get(p.user_id);
        const isMentor = mentorUserIds.has(p.user_id);

        let status: "ativo" | "pendente" | "mentor";
        if (isMentor) {
          status = "mentor";
        } else if (p.onboarding_quiz_passed || p.first_mentorship_booked || (sessionData?.hasAny ?? false)) {
          status = "ativo";
        } else {
          status = "pendente";
        }

        const firstDate = sessionData?.firstDate ?? null;
        let daysToFirst: number | null = null;
        if (firstDate) {
          const signupMs = new Date(p.created_at).getTime();
          const sessionMs = new Date(firstDate).getTime();
          daysToFirst = Math.max(0, Math.round((sessionMs - signupMs) / (1000 * 60 * 60 * 24)));
        }

        // Sort sessions by date desc
        const userSessions = sessionData?.sessions ?? [];
        userSessions.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

        return {
          user_id: p.user_id,
          name: p.name,
          photo_url: p.photo_url,
          created_at: p.created_at,
          onboarding_quiz_passed: p.onboarding_quiz_passed,
          first_mentorship_booked: p.first_mentorship_booked,
          first_session_date: firstDate,
          total_sessions: sessionData?.completedCount ?? 0,
          total_scheduled: sessionData?.scheduledCount ?? 0,
          total_cancelled: sessionData?.cancelledCount ?? 0,
          daysToFirst,
          status,
          is_mentor: isMentor,
          sessions: userSessions,
        };
      });

      rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMentees(rows);
    } catch (err) {
      console.error("Error fetching mentee breakdown:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMentees();
      setExpandedUser(null);
    }
  }, [open, fetchMentees]);

  const filtered = mentees.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const getSessionStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return { label: "Realizada", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      case "scheduled": return { label: "Agendada", className: "bg-blue-100 text-blue-700 border-blue-200" };
      case "cancelled": return { label: "Cancelada", className: "bg-red-100 text-red-700 border-red-200" };
      default: return { label: status, className: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>👥 Usuários por Etapa</DialogTitle>
          <DialogDescription>
            {mentees.filter(m => m.status === "ativo").length} ativos · {mentees.filter(m => m.status === "mentor").length} mentores · {mentees.filter(m => m.status === "pendente").length} pendentes · {mentees.length} total
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 overflow-hidden">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="flex-shrink-0">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2 h-7">Todos ({mentees.length})</TabsTrigger>
                <TabsTrigger value="ativo" className="text-xs px-2 h-7">Ativos ({mentees.filter(m => m.status === "ativo").length})</TabsTrigger>
                <TabsTrigger value="mentor" className="text-xs px-2 h-7">Mentores ({mentees.filter(m => m.status === "mentor").length})</TabsTrigger>
                <TabsTrigger value="pendente" className="text-xs px-2 h-7">Pendentes ({mentees.filter(m => m.status === "pendente").length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário encontrado</p>
            ) : (
              filtered.map((m) => {
                const isExpanded = expandedUser === m.user_id;
                return (
                  <div key={m.user_id} className="rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors overflow-hidden">
                    {/* Main row */}
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : m.user_id)}
                      className="flex items-center gap-3 p-3 w-full text-left"
                    >
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarImage src={m.photo_url || undefined} alt={m.name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                          {m.status === "mentor" ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600 flex-shrink-0">
                              <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Mentor
                            </Badge>
                          ) : m.status === "ativo" ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-600 flex-shrink-0">
                              <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 flex-shrink-0">
                              <Clock className="w-2.5 h-2.5 mr-0.5" /> Pendente
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
                          <span>Entrou: {format(new Date(m.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                          {m.total_sessions > 0 && (
                            <span className="font-medium text-foreground">{m.total_sessions} realizadas</span>
                          )}
                          {m.total_scheduled > 0 && (
                            <span className="text-blue-600">{m.total_scheduled} agendadas</span>
                          )}
                        </div>
                      </div>

                      {/* Status indicators */}
                      <div className="flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground flex-shrink-0">
                        {m.is_mentor && <span className="text-blue-600">✓ Mentor</span>}
                        {m.onboarding_quiz_passed && <span className="text-emerald-600">✓ Quiz</span>}
                        {m.first_mentorship_booked && <span className="text-emerald-600">✓ Agendou</span>}
                        {!m.is_mentor && !m.onboarding_quiz_passed && !m.first_mentorship_booked && m.total_sessions === 0 && (
                          <span className="text-amber-500">Sem atividade</span>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/50">
                        {/* Checklist */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <DetailCheck label="Quiz de onboarding" done={m.onboarding_quiz_passed} />
                          <DetailCheck label="Agendou mentoria" done={m.first_mentorship_booked} />
                          <DetailCheck label="Realizou mentoria" done={m.total_sessions > 0} />
                          <DetailCheck label="É mentor" done={m.is_mentor} />
                        </div>

                        {/* Summary stats */}
                        <div className="flex gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                          <span>📅 Cadastro: {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                          {m.first_session_date && (
                            <span>🎯 1ª mentoria: {format(new Date(m.first_session_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                          )}
                          {m.daysToFirst !== null && (
                            <span className="font-medium text-primary">⏱️ {m.daysToFirst}d até 1ª</span>
                          )}
                        </div>

                        {/* Session history */}
                        <div>
                          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            Histórico de Mentorias ({m.sessions.length})
                          </h4>
                          {m.sessions.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Nenhuma mentoria registrada</p>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {m.sessions.map((s) => {
                                const statusInfo = getSessionStatusLabel(s.status);
                                return (
                                  <div key={s.id} className="flex items-center gap-2 text-xs bg-background/60 rounded-lg px-3 py-2">
                                    <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                    <span className="text-muted-foreground">
                                      {format(new Date(s.scheduled_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusInfo.className} flex-shrink-0`}>
                                      {statusInfo.label}
                                    </Badge>
                                    {s.confirmed_by_mentor && (
                                      <span className="text-emerald-600 text-[10px]">✓ Confirmada</span>
                                    )}
                                    {s.mentor_name && (
                                      <span className="text-muted-foreground ml-auto truncate max-w-[120px]">
                                        c/ {s.mentor_name}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Totals */}
                        {m.sessions.length > 0 && (
                          <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground border-t border-border/30 pt-2">
                            <span className="text-emerald-600 font-medium">{m.total_sessions} realizadas</span>
                            <span className="text-blue-600">{m.total_scheduled} agendadas</span>
                            <span className="text-red-500">{m.total_cancelled} canceladas</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DetailCheck = ({ label, done }: { label: string; done: boolean }) => (
  <div className="flex items-center gap-2 text-xs">
    {done ? (
      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
    ) : (
      <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
    )}
    <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
  </div>
);

export default AdminMenteeBreakdownDialog;
