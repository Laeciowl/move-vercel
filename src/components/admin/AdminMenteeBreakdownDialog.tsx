import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInCalendarDays, differenceInHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, CheckCircle, Search, ChevronDown, ChevronUp, Calendar, BookOpen, Users, UserX } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Texto curto (lista) e por extenso (detalhe); menos de 24h em horas ou minutos, senão em dias corridos */
function formatSignupToEventGap(signupIso: string, eventIso: string): { compact: string; verbose: string } | null {
  const signup = new Date(signupIso);
  const event = new Date(eventIso);
  if (Number.isNaN(signup.getTime()) || Number.isNaN(event.getTime()) || event < signup) {
    return null;
  }
  const hoursTotal = differenceInHours(event, signup);
  if (hoursTotal < 24) {
    if (hoursTotal >= 1) {
      return {
        compact: `${hoursTotal}h`,
        verbose: `${hoursTotal} hora${hoursTotal !== 1 ? "s" : ""}`,
      };
    }
    const mins = differenceInMinutes(event, signup);
    if (mins >= 1) {
      return {
        compact: `${mins}min`,
        verbose: `${mins} minuto${mins !== 1 ? "s" : ""}`,
      };
    }
    return { compact: "<1min", verbose: "menos de 1 minuto" };
  }
  const days = Math.max(0, differenceInCalendarDays(event, signup));
  return {
    compact: `${days}d`,
    verbose: `${days} dia${days !== 1 ? "s" : ""}`,
  };
}

interface SessionDetail {
  id: string;
  scheduled_at: string;
  status: string;
  completed_at: string | null;
  confirmed_by_mentor: boolean | null;
  mentor_name: string | null;
}

interface AbsenceRecord {
  id: string;
  session_id: string;
  status: string;
  mentee_avisou: boolean | null;
  mentor_observations: string | null;
  reported_at: string | null;
  scheduled_at: string | null;
}

interface PenaltySummary {
  total_no_shows: number;
  status: string | null;
}

interface MenteeRow {
  user_id: string;
  name: string;
  photo_url: string | null;
  created_at: string;
  onboarding_quiz_passed: boolean;
  first_mentorship_booked: boolean;
  /** Data da 1ª mentoria concluída (completed_at mais antigo) */
  first_completed_at: string | null;
  /** Quando criou o 1º registro de sessão (= momento em que agendou na plataforma) */
  first_booking_created_at: string | null;
  /** Horário combinado da mentoria no 1º agendamento (scheduled_at da mesma sessão) */
  first_booking_session_scheduled_at: string | null;
  total_sessions: number;
  total_scheduled: number;
  total_cancelled: number;
  /** Intervalo cadastro → momento do 1º agendamento (horas se menos de 24h, senão dias) */
  signupToFirstBookingGap: { compact: string; verbose: string } | null;
  /** Intervalo cadastro → 1ª mentoria concluída */
  signupToFirstCompletedGap: { compact: string; verbose: string } | null;
  status: "ativo" | "pendente" | "mentor";
  is_mentor: boolean;
  sessions: SessionDetail[];
  /** No-shows e faltas registradas em mentee_attendance */
  absenceHistory: AbsenceRecord[];
  /** Resumo em mentee_penalties, se existir */
  penalty: PenaltySummary | null;
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
        supabase
          .from("mentor_sessions_with_names")
          .select("id, user_id, created_at, scheduled_at, status, completed_at, confirmed_by_mentor, mentor_name"),
        supabase.from("mentors").select("id, status"),
      ]);

      const profiles = profilesRes.data || [];
      const sessions = sessionsRes.data || [];
      const approvedMentors = (mentorsRes.data || []).filter((m: any) => m.status === "approved");

      const profileUserIds = profiles.map((p: any) => p.user_id as string);
      const sessionScheduleById = new Map<string, string>();
      sessions.forEach((s: any) => {
        if (s.id && s.scheduled_at) sessionScheduleById.set(s.id, s.scheduled_at);
      });

      const CHUNK = 120;
      const attendanceByUser = new Map<string, AbsenceRecord[]>();
      const penaltyByUser = new Map<string, PenaltySummary>();

      for (let i = 0; i < profileUserIds.length; i += CHUNK) {
        const chunk = profileUserIds.slice(i, i + CHUNK);
        const [attRes, penRes] = await Promise.all([
          supabase
            .from("mentee_attendance")
            .select("id, session_id, mentee_user_id, status, mentee_avisou, mentor_observations, reported_at")
            .in("mentee_user_id", chunk),
          supabase.from("mentee_penalties").select("user_id, total_no_shows, status").in("user_id", chunk),
        ]);

        (attRes.data || []).forEach((row: any) => {
          if (row.status !== "no_show_mentorado" && row.status !== "no_show_mentor") return;
          const rec: AbsenceRecord = {
            id: row.id,
            session_id: row.session_id,
            status: row.status,
            mentee_avisou: row.mentee_avisou,
            mentor_observations: row.mentor_observations,
            reported_at: row.reported_at,
            scheduled_at: sessionScheduleById.get(row.session_id) ?? null,
          };
          const list = attendanceByUser.get(row.mentee_user_id) ?? [];
          list.push(rec);
          attendanceByUser.set(row.mentee_user_id, list);
        });

        (penRes.data || []).forEach((row: any) => {
          penaltyByUser.set(row.user_id, {
            total_no_shows: row.total_no_shows ?? 0,
            status: row.status ?? null,
          });
        });
      }

      attendanceByUser.forEach((list, uid) => {
        list.sort((a, b) => {
          const ta = a.reported_at ? new Date(a.reported_at).getTime() : 0;
          const tb = b.reported_at ? new Date(b.reported_at).getTime() : 0;
          return tb - ta;
        });
        attendanceByUser.set(uid, list);
      });

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
        /** created_at mais antigo e o scheduled_at dessa mesma linha (1º agendamento na plataforma) */
        firstBookingCreatedAt: string | null;
        firstBookingSessionScheduledAt: string | null;
        earliestCompletedAt: string | null;
        completedCount: number;
        scheduledCount: number;
        cancelledCount: number;
        hasAny: boolean;
        sessions: SessionDetail[];
      }>();

      sessions.forEach((s: any) => {
        const existing = userSessionMap.get(s.user_id);
        const isCompleted = s.status === "completed" && s.completed_at;
        const createdAt = s.created_at as string | undefined;
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
            firstBookingCreatedAt: createdAt ?? null,
            firstBookingSessionScheduledAt: s.scheduled_at ?? null,
            earliestCompletedAt: isCompleted ? s.completed_at : null,
            completedCount: isCompleted ? 1 : 0,
            scheduledCount: s.status === "scheduled" ? 1 : 0,
            cancelledCount: s.status === "cancelled" ? 1 : 0,
            hasAny: true,
            sessions: [detail],
          });
        } else {
          existing.hasAny = true;
          existing.sessions.push(detail);
          if (
            createdAt &&
            (!existing.firstBookingCreatedAt || createdAt < existing.firstBookingCreatedAt)
          ) {
            existing.firstBookingCreatedAt = createdAt;
            existing.firstBookingSessionScheduledAt = s.scheduled_at ?? null;
          }
          if (s.status === "scheduled") existing.scheduledCount++;
          if (s.status === "cancelled") existing.cancelledCount++;
          if (isCompleted) {
            existing.completedCount++;
            if (
              !existing.earliestCompletedAt ||
              s.completed_at < existing.earliestCompletedAt
            ) {
              existing.earliestCompletedAt = s.completed_at;
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

        const firstBookingCreatedAt = sessionData?.firstBookingCreatedAt ?? null;
        const firstBookingSessionScheduledAt = sessionData?.firstBookingSessionScheduledAt ?? null;
        const firstCompletedAt = sessionData?.earliestCompletedAt ?? null;

        const signupToFirstBookingGap = firstBookingCreatedAt
          ? formatSignupToEventGap(p.created_at, firstBookingCreatedAt)
          : null;
        const signupToFirstCompletedGap = firstCompletedAt
          ? formatSignupToEventGap(p.created_at, firstCompletedAt)
          : null;

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
          first_booking_created_at: firstBookingCreatedAt,
          first_booking_session_scheduled_at: firstBookingSessionScheduledAt,
          first_completed_at: firstCompletedAt,
          total_sessions: sessionData?.completedCount ?? 0,
          total_scheduled: sessionData?.scheduledCount ?? 0,
          total_cancelled: sessionData?.cancelledCount ?? 0,
          signupToFirstBookingGap,
          signupToFirstCompletedGap,
          status,
          is_mentor: isMentor,
          sessions: userSessions,
          absenceHistory: attendanceByUser.get(p.user_id) ?? [],
          penalty: penaltyByUser.get(p.user_id) ?? null,
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
      case "completed":
        return { label: "Realizada", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" };
      case "scheduled":
        return { label: "Agendada", className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" };
      case "cancelled":
        return { label: "Cancelada", className: "bg-destructive/10 text-destructive border-destructive/20" };
      default:
        return { label: status, className: "bg-muted/80 text-muted-foreground border-border" };
    }
  };

  const absenceTypeLabel = (status: string) => {
    if (status === "no_show_mentorado") return "Mentorado não compareceu";
    if (status === "no_show_mentor") return "Mentor não compareceu";
    return status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-hidden flex flex-col gap-0 p-0 sm:rounded-2xl border-border/60 shadow-lg">
        <DialogHeader className="px-5 pt-5 pb-4 space-y-1.5 border-b border-border/50">
          <DialogTitle className="text-base font-semibold tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground opacity-80" />
            Usuários por etapa
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {mentees.filter((m) => m.status === "ativo").length} ativos ·{" "}
            {mentees.filter((m) => m.status === "mentor").length} mentores ·{" "}
            {mentees.filter((m) => m.status === "pendente").length} pendentes · {mentees.length} total
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 flex-1 min-h-0 px-5 pb-5 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
              <TabsList className="h-9 w-full sm:w-auto bg-muted/50 p-1 rounded-lg">
                <TabsTrigger value="all" className="text-[11px] px-2.5 h-7 rounded-md data-[state=active]:bg-background">
                  Todos ({mentees.length})
                </TabsTrigger>
                <TabsTrigger value="ativo" className="text-[11px] px-2.5 h-7 rounded-md data-[state=active]:bg-background">
                  Ativos
                </TabsTrigger>
                <TabsTrigger value="mentor" className="text-[11px] px-2.5 h-7 rounded-md data-[state=active]:bg-background">
                  Mentores
                </TabsTrigger>
                <TabsTrigger value="pendente" className="text-[11px] px-2.5 h-7 rounded-md data-[state=active]:bg-background">
                  Pendentes
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm rounded-lg border-border/60 bg-background"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px] -mx-1 px-1 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum usuário encontrado</p>
            ) : (
              filtered.map((m) => {
                const isExpanded = expandedUser === m.user_id;
                const nAbs = m.absenceHistory.length;
                return (
                  <div
                    key={m.user_id}
                    className={`rounded-xl border transition-colors overflow-hidden ${
                      isExpanded ? "border-border bg-card shadow-sm" : "border-border/50 bg-card/40 hover:border-border hover:bg-card/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedUser(isExpanded ? null : m.user_id)}
                      className="flex items-center gap-3 w-full text-left p-3.5"
                    >
                      <Avatar className="w-10 h-10 flex-shrink-0 ring-1 ring-border/60">
                        <AvatarImage src={m.photo_url || undefined} alt={m.name} />
                        <AvatarFallback className="text-xs font-medium bg-muted text-muted-foreground">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground truncate">{m.name}</span>
                          <RoleBadge status={m.status} />
                          {nAbs > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-destructive bg-destructive/8 px-1.5 py-0.5 rounded-md">
                              <UserX className="w-3 h-3" />
                              {nAbs}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>Cadastro {format(new Date(m.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                          {m.signupToFirstBookingGap && (
                            <span className="text-foreground/90">
                              · 1º agend. +{m.signupToFirstBookingGap.compact}
                            </span>
                          )}
                          {m.signupToFirstCompletedGap &&
                            m.signupToFirstBookingGap &&
                            m.signupToFirstCompletedGap.compact !== m.signupToFirstBookingGap.compact && (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                · 1ª feita +{m.signupToFirstCompletedGap.compact}
                              </span>
                            )}
                          {m.total_sessions > 0 && <span>· {m.total_sessions} realiz.</span>}
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 space-y-4 border-t border-border/40 bg-muted/20">
                        <div className="pt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                          <DetailCheck label="Quiz onboarding" done={m.onboarding_quiz_passed} />
                          <DetailCheck label="Agendou mentoria" done={m.first_mentorship_booked} />
                          <DetailCheck label="Realizou mentoria" done={m.total_sessions > 0} />
                          <DetailCheck label="Perfil mentor" done={m.is_mentor} />
                        </div>

                        <section className="space-y-2">
                          <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Tempo até a 1ª mentoria
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5 space-y-1">
                              <p className="text-muted-foreground">1º agendamento</p>
                              {m.first_booking_created_at && m.signupToFirstBookingGap ? (
                                <>
                                  <p className="font-semibold text-foreground">{m.signupToFirstBookingGap.verbose}</p>
                                  <p className="text-[11px] text-muted-foreground leading-snug">
                                    Ação: {format(new Date(m.first_booking_created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  </p>
                                  {m.first_booking_session_scheduled_at && (
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                      Sessão: {format(new Date(m.first_booking_session_scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-muted-foreground italic">—</p>
                              )}
                            </div>
                            <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5 space-y-1">
                              <p className="text-muted-foreground">1ª realizada</p>
                              {m.first_completed_at && m.signupToFirstCompletedGap ? (
                                <>
                                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">{m.signupToFirstCompletedGap.verbose}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {format(new Date(m.first_completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  </p>
                                </>
                              ) : (
                                <p className="text-muted-foreground italic">—</p>
                              )}
                            </div>
                          </div>
                        </section>

                        <section className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <UserX className="w-3 h-3 opacity-70" />
                              Faltas / comparecimento
                            </h4>
                            {m.penalty && m.penalty.total_no_shows > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                Penalidade: {m.penalty.total_no_shows} falta{m.penalty.total_no_shows !== 1 ? "s" : ""}
                                {m.penalty.status ? ` · ${m.penalty.status}` : ""}
                              </span>
                            )}
                          </div>
                          {m.absenceHistory.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">Nenhuma falta registrada neste histórico.</p>
                          ) : (
                            <ul className="rounded-lg border border-border/50 divide-y divide-border/40 overflow-hidden bg-background/80 max-h-40 overflow-y-auto">
                              {m.absenceHistory.map((a) => (
                                <li key={a.id} className="px-3 py-2 text-xs space-y-0.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-medium text-foreground leading-tight">{absenceTypeLabel(a.status)}</span>
                                    {a.reported_at && (
                                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                        {format(new Date(a.reported_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                                      </span>
                                    )}
                                  </div>
                                  {a.scheduled_at && (
                                    <p className="text-[11px] text-muted-foreground">
                                      Sessão prevista: {format(new Date(a.scheduled_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </p>
                                  )}
                                  {a.status === "no_show_mentorado" && (
                                    <p className="text-[11px] text-muted-foreground">
                                      {a.mentee_avisou === true ? "Com aviso prévio (sem penalizar por no-show)" : "Sem aviso prévio"}
                                    </p>
                                  )}
                                  {a.mentor_observations && (
                                    <p className="text-[11px] text-muted-foreground/90 italic line-clamp-2">“{a.mentor_observations}”</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>

                        <section className="space-y-2">
                          <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 opacity-70" />
                            Mentorias ({m.sessions.length})
                          </h4>
                          {m.sessions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhuma sessão.</p>
                          ) : (
                            <>
                              <ul className="rounded-lg border border-border/50 divide-y divide-border/40 overflow-hidden bg-background/80 max-h-44 overflow-y-auto">
                                {m.sessions.map((s) => {
                                  const statusInfo = getSessionStatusLabel(s.status);
                                  return (
                                    <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-60" />
                                      <span className="text-muted-foreground tabular-nums shrink-0">
                                        {format(new Date(s.scheduled_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                                      </span>
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal border shrink-0 ${statusInfo.className}`}>
                                        {statusInfo.label}
                                      </Badge>
                                      {s.mentor_name && (
                                        <span className="text-muted-foreground truncate ml-auto min-w-0 text-right">{s.mentor_name}</span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-0.5">
                                <span>{m.total_sessions} realiz.</span>
                                <span>{m.total_scheduled} agend.</span>
                                <span>{m.total_cancelled} cancel.</span>
                              </div>
                            </>
                          )}
                        </section>
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

function RoleBadge({ status }: { status: "ativo" | "pendente" | "mentor" }) {
  if (status === "mentor") {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/15">
        Mentor
      </span>
    );
  }
  if (status === "ativo") {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/15">
        Ativo
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/15">
      Pendente
    </span>
  );
}

const DetailCheck = ({ label, done }: { label: string; done: boolean }) => (
  <div className="flex items-center gap-2 text-xs">
    {done ? (
      <CheckCircle className="w-3.5 h-3.5 text-emerald-600/90 dark:text-emerald-400 shrink-0" strokeWidth={1.75} />
    ) : (
      <span className="w-3.5 h-3.5 shrink-0 rounded-full border border-muted-foreground/25" aria-hidden />
    )}
    <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
  </div>
);

export default AdminMenteeBreakdownDialog;
