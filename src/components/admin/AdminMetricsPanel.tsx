import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminTrailsNpsPanel from "./AdminTrailsNpsPanel";
import AdminMenteeBreakdownDialog from "./AdminMenteeBreakdownDialog";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, AlertTriangle, CheckCircle, RefreshCw,
  ArrowUpRight, ArrowDownRight, Minus, ChevronDown, ChevronUp,
  CalendarIcon, Inbox, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

// ─── Constants ───────────────────────────────────────────
const LAUNCH_DATE = new Date(2026, 0, 1); // January 1, 2026 in local time

type GrowthPeriod = "launch" | "this_month" | "last_month" | "last_3_months" | "custom";

const PERIOD_OPTIONS: { value: GrowthPeriod; label: string }[] = [
  { value: "launch", label: "Desde o lançamento" },
  { value: "this_month", label: "Mês atual" },
  { value: "last_month", label: "Último mês" },
  { value: "last_3_months", label: "Últimos 3 meses" },
  { value: "custom", label: "Período personalizado" },
];

// ─── Types ───────────────────────────────────────────────
interface CoreMetrics {
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  menteesQuizPassed: number;
  menteesQuizNotPassed: number;
  completedSessions: number;
  completedThisMonth: number;
  completedLastMonth: number;
  livesImpacted: number;
  scheduledSessions: number;
}

interface HealthMetricData {
  label: string;
  value: number;
  benchmarkGood: number;
  benchmarkAlert: number;
  suffix: string;
  type: "activation" | "confirmation" | "completion" | "retention" | "time_to_first";
  details: Record<string, any>;
}

interface GrowthData {
  month: string;
  sessions: number;
  new_mentors: number;
  new_mentees: number;
}

interface MentorAlertDetail {
  id: string;
  name: string;
  area: string;
  daysSince: number;
  pendingCount?: number;
}

interface RetentionMentee {
  name: string;
  totalSessions: number;
  lastSession: string;
  mentors: string[];
}

// ─── Helpers ─────────────────────────────────────────────
const getStatusIcon = (value: number, good: number, alert: number, lowerIsBetter = false) => {
  if (lowerIsBetter) {
    if (value <= good) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (value <= alert) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  }
  if (value >= good) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (value >= alert) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <AlertTriangle className="w-4 h-4 text-destructive" />;
};

const getStatusColor = (value: number, good: number, alert: number, lowerIsBetter = false) => {
  if (lowerIsBetter) {
    if (value <= good) return "text-emerald-500";
    if (value <= alert) return "text-amber-500";
    return "text-destructive";
  }
  if (value >= good) return "text-emerald-500";
  if (value >= alert) return "text-amber-500";
  return "text-destructive";
};

const getGrowthIndicator = (current: number, previous: number) => {
  if (previous === 0 && current > 0)
    return { pct: 100, icon: <ArrowUpRight className="w-4 h-4" />, color: "text-emerald-500" };
  if (previous === 0)
    return { pct: 0, icon: <Minus className="w-4 h-4" />, color: "text-muted-foreground" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { pct, icon: <ArrowUpRight className="w-4 h-4" />, color: "text-emerald-500" };
  if (pct < 0) return { pct, icon: <ArrowDownRight className="w-4 h-4" />, color: "text-destructive" };
  return { pct: 0, icon: <Minus className="w-4 h-4" />, color: "text-muted-foreground" };
};

const getDateRange = (period: GrowthPeriod, customFrom?: Date, customTo?: Date): [Date, Date] => {
  const now = new Date();
  switch (period) {
    case "launch":
      return [LAUNCH_DATE, now];
    case "this_month":
      return [startOfMonth(now), now];
    case "last_month":
      return [startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))];
    case "last_3_months":
      return [startOfMonth(subMonths(now, 2)), now];
    case "custom":
      return [customFrom ?? LAUNCH_DATE, customTo ?? now];
    default:
      return [LAUNCH_DATE, now];
  }
};

const groupByMonth = (items: { date: string }[]): Map<string, number> => {
  const map = new Map<string, number>();
  items.forEach(({ date }) => {
    if (!date) return;
    const d = new Date(date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
};

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── Component ───────────────────────────────────────────
const AdminMetricsPanel = () => {
  const [coreMetrics, setCoreMetrics] = useState<CoreMetrics | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetricData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>("launch");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [alerts, setAlerts] = useState<{
    pending_48h: number;
    noRequestsCount: number;
    notRespondingCount: number;
    avg_mentorships_per_mentee: number;
    mentor_to_mentee_ratio: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGrowth, setLoadingGrowth] = useState(false);

  // Detail states
  const [noRequestDetails, setNoRequestDetails] = useState<MentorAlertDetail[] | null>(null);
  const [notRespondingDetails, setNotRespondingDetails] = useState<MentorAlertDetail[] | null>(null);
  const [retentionDetails, setRetentionDetails] = useState<RetentionMentee[] | null>(null);
  const [loadingNoReq, setLoadingNoReq] = useState(false);
  const [loadingNotResp, setLoadingNotResp] = useState(false);
  const [loadingRetention, setLoadingRetention] = useState(false);
  const [showNoReqDialog, setShowNoReqDialog] = useState(false);
  const [showNotRespDialog, setShowNotRespDialog] = useState(false);
  const [showRetentionDialog, setShowRetentionDialog] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const [showMenteeBreakdown, setShowMenteeBreakdown] = useState(false);

  // ─── Data Fetching ─────────────────────────────────
  const fetchCoreAndHealth = useCallback(async () => {
    try {
      const now = new Date();
      const thisMonthStart = startOfMonth(now).toISOString();
      const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

      const [
        profilesRes, mentorsRes, completedRes, livesRes, scheduledRes,
        activationRes, confirmationRes, completionRes, retentionRes,
        thisMonthRes, lastMonthRes,
        quizPassedRes, quizNotPassedRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("mentors").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.rpc("get_total_completed_sessions"),
        supabase.rpc("get_lives_impacted"),
        supabase.rpc("get_future_scheduled_sessions"),
        supabase.rpc("get_activation_rate"),
        supabase.rpc("get_confirmation_rate"),
        supabase.rpc("get_completion_rate"),
        supabase.rpc("get_retention_rate"),
        supabase.from("mentor_sessions")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("completed_at", thisMonthStart),
        supabase.from("mentor_sessions")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("completed_at", lastMonthStart)
          .lte("completed_at", lastMonthEnd),
        supabase.from("profiles").select("user_id, created_at, onboarding_quiz_passed, first_mentorship_booked"),
        supabase.from("mentor_sessions").select("user_id, completed_at, status"),
      ]);

      const totalUsers = profilesRes.count || 0;
      const totalMentors = mentorsRes.count || 0;

      // Build profile + session data for active/pending and time-to-first calc
      const allProfiles = quizPassedRes.data || [];
      const allSessions = quizNotPassedRes.data || [];
      const completedUserIds = new Set<string>();
      
      // Map: user_id -> earliest completed_at
      const firstSessionMap = new Map<string, string>();
      allSessions.forEach((s: any) => {
        if (s.status === "completed" && s.completed_at) {
          completedUserIds.add(s.user_id);
          const existing = firstSessionMap.get(s.user_id);
          if (!existing || s.completed_at < existing) {
            firstSessionMap.set(s.user_id, s.completed_at);
          }
        } else {
          // has any session at all
          completedUserIds.add(s.user_id);
        }
      });

      // Calculate time-to-first-mentorship (days) for users who have completed sessions
      const daysToFirst: number[] = [];
      const profileCreatedMap = new Map<string, string>();
      allProfiles.forEach((p: any) => {
        profileCreatedMap.set(p.user_id, p.created_at);
        const firstSession = firstSessionMap.get(p.user_id);
        if (firstSession) {
          const signupDate = new Date(p.created_at).getTime();
          const sessionDate = new Date(firstSession).getTime();
          const days = Math.max(0, Math.round((sessionDate - signupDate) / (1000 * 60 * 60 * 24)));
          daysToFirst.push(days);
        }
      });
      
      // Get mentor user_ids to exclude from active/pending counts
      const mentorUserIdsForCard = new Set<string>();
      if (totalMentors > 0) {
        const { data: mentorList } = await supabase.from("mentors").select("id").eq("status", "approved");
        if (mentorList && mentorList.length > 0) {
          const mIds = mentorList.map((m: any) => m.id);
          for (let i = 0; i < mIds.length; i += 50) {
            const chunk = mIds.slice(i, i + 50);
            const { data } = await supabase.rpc("get_mentor_user_ids", { mentor_ids: chunk });
            if (data) data.forEach((d: any) => mentorUserIdsForCard.add(d.user_id));
          }
        }
      }

      let activeCount = 0;
      let pendingCount = 0;
      allProfiles.forEach((p: any) => {
        // Skip mentors from active/pending classification
        if (mentorUserIdsForCard.has(p.user_id)) return;
        const isActive = p.onboarding_quiz_passed || p.first_mentorship_booked || completedUserIds.has(p.user_id);
        if (isActive) activeCount++;
        else pendingCount++;
      });

      setCoreMetrics({
        totalUsers,
        totalMentors,
        totalMentees: totalUsers - totalMentors,
        menteesQuizPassed: activeCount,
        menteesQuizNotPassed: pendingCount,
        completedSessions: (completedRes.data as number) ?? 0,
        completedThisMonth: thisMonthRes.count ?? 0,
        completedLastMonth: lastMonthRes.count ?? 0,
        livesImpacted: (livesRes.data as number) ?? 0,
        scheduledSessions: (scheduledRes.data as number) ?? 0,
      });

      const activation = activationRes.data as any;
      const confirmation = confirmationRes.data as any;
      const completion = completionRes.data as any;
      const retention = retentionRes.data as any;

      setHealthMetrics([
        {
          label: "Taxa de Ativação (mentorados)",
          value: Number(activation?.rate ?? 0),
          benchmarkGood: 60, benchmarkAlert: 40, suffix: "%",
          type: "activation",
          details: { total_mentees: activation?.total_mentees, activated: activation?.activated },
        },
        {
          label: "Taxa de Confirmação",
          value: Number(confirmation?.rate ?? 0),
          benchmarkGood: 75, benchmarkAlert: 60, suffix: "%",
          type: "confirmation",
          details: { total: confirmation?.total, confirmed: confirmation?.confirmed },
        },
        {
          label: "Taxa de Conclusão",
          value: Number(completion?.rate ?? 0),
          benchmarkGood: 80, benchmarkAlert: 70, suffix: "%",
          type: "completion",
          details: { total: completion?.total, completed: completion?.completed, cancelled: completion?.cancelled },
        },
        {
          label: "Taxa de Retenção (2ª mentoria)",
          value: Number(retention?.rate ?? 0),
          benchmarkGood: 50, benchmarkAlert: 30, suffix: "%",
          type: "retention",
          details: { total: retention?.total, retained: retention?.retained },
        },
        {
          label: "Tempo até 1ª Mentoria",
          value: daysToFirst.length > 0 ? Math.round(daysToFirst.reduce((a, b) => a + b, 0) / daysToFirst.length) : 0,
          benchmarkGood: 7, benchmarkAlert: 14, suffix: " dias",
          type: "time_to_first",
          details: {
            total_with_session: daysToFirst.length,
            median: daysToFirst.length > 0 ? daysToFirst.sort((a, b) => a - b)[Math.floor(daysToFirst.length / 2)] : 0,
            min: daysToFirst.length > 0 ? Math.min(...daysToFirst) : 0,
            max: daysToFirst.length > 0 ? Math.max(...daysToFirst) : 0,
          },
        },
      ]);
    } catch (err) {
      console.error("Error fetching core metrics:", err);
      toast.error("Erro ao carregar métricas");
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const [alertsRes, allMentorsRes, recentSessionsRes, pendingSessionsRes] = await Promise.all([
        supabase.rpc("get_admin_alerts"),
        supabase.from("mentors").select("id, created_at, temporarily_unavailable").eq("status", "approved"),
        supabase.from("mentor_sessions").select("mentor_id").gte("created_at", fourteenDaysAgo.toISOString()),
        supabase.from("mentor_sessions")
          .select("mentor_id")
          .eq("status", "scheduled")
          .eq("confirmed_by_mentor", false)
          .lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()),
      ]);

      const alertData = alertsRes.data as any;
      // Only consider mentors created more than 14 days ago AND available
      const mentorsOldEnough = (allMentorsRes.data || []).filter((m: any) => {
        const created = new Date(m.created_at);
        return created.getTime() <= fourteenDaysAgo.getTime() && !m.temporarily_unavailable;
      });
      const mentorIds = new Set(mentorsOldEnough.map((m: any) => m.id));
      const mentorsWithSessions = new Set(recentSessionsRes.data?.map((s: any) => s.mentor_id) || []);
      const mentorsWithPending = new Set(pendingSessionsRes.data?.map((s: any) => s.mentor_id) || []);

      // Mentors without any requests in 14+ days (excluding recently joined AND unavailable)
      let noRequestsCount = 0;
      mentorIds.forEach((id) => {
        if (!mentorsWithSessions.has(id)) noRequestsCount++;
      });

      // Mentors with pending sessions not confirmed
      const notRespondingCount = mentorsWithPending.size;

      setAlerts({
        pending_48h: alertData?.pending_48h ?? 0,
        noRequestsCount,
        notRespondingCount,
        avg_mentorships_per_mentee: alertData?.avg_mentorships_per_mentee ?? 0,
        mentor_to_mentee_ratio: alertData?.mentor_to_mentee_ratio ?? 0,
      });
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  }, []);

  const fetchGrowthData = useCallback(async (period: GrowthPeriod, cfrom?: Date, cto?: Date) => {
    setLoadingGrowth(true);
    try {
      const [start, end] = getDateRange(period, cfrom, cto);

      const [sessionsRes, mentorsRes, menteesRes] = await Promise.all([
        supabase.from("mentor_sessions")
          .select("completed_at")
          .eq("status", "completed")
          .not("confirmed_at", "is", null)
          .gte("completed_at", start.toISOString())
          .lte("completed_at", end.toISOString()),
        supabase.from("mentors")
          .select("created_at")
          .eq("status", "approved")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString()),
        supabase.from("profiles")
          .select("created_at")
          .gte("created_at", start.toISOString())
          .lte("created_at", end.toISOString()),
      ]);

      // Generate all months in range
      const months: { key: string; label: string }[] = [];
      const cursor = new Date(start);
      cursor.setDate(1);
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        const label = `${MONTH_NAMES[cursor.getMonth()]}/${String(cursor.getFullYear()).slice(2)}`;
        months.push({ key, label });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const sessionsByMonth = groupByMonth((sessionsRes.data || []).map((s: any) => ({ date: s.completed_at })));
      const mentorsByMonth = groupByMonth((mentorsRes.data || []).map((m: any) => ({ date: m.created_at })));
      const menteesByMonth = groupByMonth((menteesRes.data || []).map((m: any) => ({ date: m.created_at })));

      const data: GrowthData[] = months.map(({ key, label }) => ({
        month: label,
        sessions: sessionsByMonth.get(key) || 0,
        new_mentors: mentorsByMonth.get(key) || 0,
        new_mentees: menteesByMonth.get(key) || 0,
      }));

      setGrowthData(data);
    } catch (err) {
      console.error("Error fetching growth data:", err);
    } finally {
      setLoadingGrowth(false);
    }
  }, []);

  // ─── Detail Fetchers (lazy) ────────────────────────
  const fetchNoRequestDetails = useCallback(async () => {
    setLoadingNoReq(true);
    try {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const [mentorsRes, sessionsRes] = await Promise.all([
        supabase.from("mentors").select("id, name, area, created_at").eq("status", "approved"),
        supabase.from("mentor_sessions").select("mentor_id").gte("created_at", fourteenDaysAgo.toISOString()),
      ]);

      const mentorsWithSessions = new Set((sessionsRes.data || []).map((s: any) => s.mentor_id));
      const now = Date.now();

      const details: MentorAlertDetail[] = (mentorsRes.data || [])
        .filter((m: any) => !mentorsWithSessions.has(m.id) && new Date(m.created_at).getTime() <= fourteenDaysAgo.getTime())
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          area: m.area,
          daysSince: Math.floor((now - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        }))
        .sort((a: MentorAlertDetail, b: MentorAlertDetail) => b.daysSince - a.daysSince);

      setNoRequestDetails(details);
    } catch (err) {
      console.error("Error fetching no-request details:", err);
    } finally {
      setLoadingNoReq(false);
    }
  }, []);

  const fetchNotRespondingDetails = useCallback(async () => {
    setLoadingNotResp(true);
    try {
      const { data: pendingSessions } = await supabase
        .from("mentor_sessions")
        .select("mentor_id, created_at")
        .eq("status", "scheduled")
        .eq("confirmed_by_mentor", false);

      // Group by mentor
      const mentorPending = new Map<string, { count: number; oldest: Date }>();
      (pendingSessions || []).forEach((s: any) => {
        const existing = mentorPending.get(s.mentor_id);
        const created = new Date(s.created_at);
        if (!existing) {
          mentorPending.set(s.mentor_id, { count: 1, oldest: created });
        } else {
          existing.count++;
          if (created < existing.oldest) existing.oldest = created;
        }
      });

      if (mentorPending.size === 0) {
        setNotRespondingDetails([]);
        setLoadingNotResp(false);
        return;
      }

      const mentorIds = Array.from(mentorPending.keys());
      const { data: mentors } = await supabase
        .from("mentors")
        .select("id, name, area")
        .in("id", mentorIds);

      const now = Date.now();
      const details: MentorAlertDetail[] = (mentors || []).map((m: any) => {
        const pending = mentorPending.get(m.id)!;
        return {
          id: m.id,
          name: m.name,
          area: m.area,
          daysSince: Math.floor((now - pending.oldest.getTime()) / (1000 * 60 * 60 * 24)),
          pendingCount: pending.count,
        };
      }).sort((a, b) => b.daysSince - a.daysSince);

      setNotRespondingDetails(details);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoadingNotResp(false);
    }
  }, []);

  const fetchRetentionDetails = useCallback(async () => {
    setLoadingRetention(true);
    try {
      const { data: sessions } = await supabase
        .from("mentor_sessions")
        .select("user_id, mentor_id, completed_at")
        .eq("status", "completed");

      // Get mentor names
      const mentorIds = [...new Set((sessions || []).map((s: any) => s.mentor_id))];
      const { data: mentors } = await supabase
        .from("mentors")
        .select("id, name")
        .in("id", mentorIds);
      const mentorNameMap = new Map((mentors || []).map((m: any) => [m.id, m.name]));

      // Group by user
      const userMap = new Map<string, { count: number; lastDate: string; mentorNames: Set<string> }>();
      (sessions || []).forEach((s: any) => {
        const existing = userMap.get(s.user_id);
        const mentorName = mentorNameMap.get(s.mentor_id) || "Desconhecido";
        if (!existing) {
          userMap.set(s.user_id, { count: 1, lastDate: s.completed_at, mentorNames: new Set([mentorName]) });
        } else {
          existing.count++;
          if (s.completed_at > existing.lastDate) existing.lastDate = s.completed_at;
          existing.mentorNames.add(mentorName);
        }
      });

      // Filter 2+
      const retainedUserIds = Array.from(userMap.entries())
        .filter(([, d]) => d.count >= 2)
        .map(([uid]) => uid);

      if (retainedUserIds.length === 0) {
        setRetentionDetails([]);
        setLoadingRetention(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", retainedUserIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.name]));

      const details: RetentionMentee[] = retainedUserIds
        .map((uid) => {
          const d = userMap.get(uid)!;
          return {
            name: profileMap.get(uid) || "Desconhecido",
            totalSessions: d.count,
            lastSession: d.lastDate,
            mentors: Array.from(d.mentorNames),
          };
        })
        .sort((a, b) => b.totalSessions - a.totalSessions);

      setRetentionDetails(details);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoadingRetention(false);
    }
  }, []);

  // ─── Effects ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCoreAndHealth(), fetchAlerts(), fetchGrowthData("launch")]);
      setLoading(false);
    };
    load();
  }, [fetchCoreAndHealth, fetchAlerts, fetchGrowthData]);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchCoreAndHealth(), fetchAlerts(), fetchGrowthData(growthPeriod, customFrom, customTo)]);
    setLoading(false);
  };

  const handlePeriodChange = (period: GrowthPeriod) => {
    setGrowthPeriod(period);
    if (period !== "custom") {
      fetchGrowthData(period);
    }
  };

  const handleCustomDateApply = () => {
    if (customFrom && customTo) {
      fetchGrowthData("custom", customFrom, customTo);
    }
  };

  // ─── Render ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!coreMetrics) {
    return <p className="text-muted-foreground text-center py-8">Erro ao carregar métricas</p>;
  }

  const sessionGrowth = getGrowthIndicator(coreMetrics.completedThisMonth, coreMetrics.completedLastMonth);
  const hasAlerts = alerts && (alerts.pending_48h > 0 || alerts.noRequestsCount > 0 || alerts.notRespondingCount > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📊 Métricas Essenciais</h3>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 rounded-xl">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Core Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">💬 Mentorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coreMetrics.completedSessions}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">{coreMetrics.completedThisMonth} este mês</span>
              <span className={`flex items-center text-xs font-medium ${sessionGrowth.color}`}>
                {sessionGrowth.icon}
                {sessionGrowth.pct > 0 ? "+" : ""}{sessionGrowth.pct}%
              </span>
            </div>
            {coreMetrics.scheduledSessions > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{coreMetrics.scheduledSessions} agendadas</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">❤️ Impacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coreMetrics.livesImpacted}</div>
            <p className="text-sm text-muted-foreground mt-1">vidas impactadas</p>
            {alerts && Number(alerts.avg_mentorships_per_mentee) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Média de {alerts.avg_mentorships_per_mentee} mentorias/mentorado
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">👥 Usuários</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setShowMenteeBreakdown(true)}>
              Ver detalhes
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coreMetrics.totalUsers}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {coreMetrics.totalMentors} mentores · {coreMetrics.totalMentees} mentorados
            </p>
            <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
              <p className="text-xs font-medium text-foreground">Mentorados por etapa:</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-3 h-3" />
                  {coreMetrics.menteesQuizPassed} ativos (quiz aprovado ou com mentorias)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <Clock className="w-3 h-3" />
                  {coreMetrics.menteesQuizNotPassed} pendentes (não fizeram/passaram no quiz)
                </span>
              </div>
            </div>
            {alerts && Number(alerts.mentor_to_mentee_ratio) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Proporção: 1 mentor para cada {alerts.mentor_to_mentee_ratio} usuários
              </p>
            )}
          </CardContent>
        </Card>

        <AdminMenteeBreakdownDialog
          open={showMenteeBreakdown}
          onOpenChange={setShowMenteeBreakdown}
          activeCount={coreMetrics.menteesQuizPassed}
          pendingCount={coreMetrics.menteesQuizNotPassed}
        />
      </div>

      {/* Health Metrics */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">🔥 Health Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthMetrics.map((metric) => (
              <div key={metric.type}>
                <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${getStatusColor(metric.value, metric.benchmarkGood, metric.benchmarkAlert, metric.type === "time_to_first")}`}>
                      {metric.value}{metric.suffix}
                    </span>
                    {getStatusIcon(metric.value, metric.benchmarkGood, metric.benchmarkAlert, metric.type === "time_to_first")}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (metric.type === "retention") {
                          if (!retentionDetails) fetchRetentionDetails();
                          setShowRetentionDialog(true);
                        } else {
                          setExpandedMetric(expandedMetric === metric.type ? null : metric.type);
                        }
                      }}
                    >
                      {expandedMetric === metric.type ? (
                        <ChevronUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ChevronDown className="w-3 h-3 mr-1" />
                      )}
                      Detalhes
                    </Button>
                  </div>
                </div>

                {/* Inline details for non-retention metrics */}
                {expandedMetric === metric.type && metric.type !== "retention" && (
                  <div className="bg-muted/50 rounded-lg p-3 mt-1 mb-2 text-sm text-muted-foreground space-y-1">
                    {metric.type === "activation" && (
                      <>
                        <p><strong className="text-foreground">{metric.details.activated}</strong> de {metric.details.total_mentees} mentorados tiveram pelo menos 1 mentoria completada.</p>
                      </>
                    )}
                    {metric.type === "confirmation" && (
                      <>
                        <p><strong className="text-foreground">{metric.details.confirmed}</strong> de {metric.details.total} solicitações agendadas foram confirmadas pelos mentores.</p>
                      </>
                    )}
                    {metric.type === "completion" && (
                      <>
                        <p><strong className="text-foreground">{metric.details.completed}</strong> de {metric.details.total} mentorias foram concluídas.</p>
                        <p><strong className="text-foreground">{metric.details.cancelled}</strong> foram canceladas.</p>
                      </>
                    )}
                    {metric.type === "time_to_first" && (
                      <>
                        <p><strong className="text-foreground">{metric.details.total_with_session}</strong> mentorados realizaram pelo menos 1 mentoria.</p>
                        <p>Mediana: <strong className="text-foreground">{metric.details.median} dias</strong></p>
                        <p>Mínimo: <strong className="text-foreground">{metric.details.min} dias</strong> · Máximo: <strong className="text-foreground">{metric.details.max} dias</strong></p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> Saudável</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-500" /> Atenção</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-destructive" /> Crítico</span>
          </div>
        </CardContent>
      </Card>

      {/* Growth Chart */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">📈 Crescimento</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={growthPeriod} onValueChange={(v) => handlePeriodChange(v as GrowthPeriod)}>
              <SelectTrigger className="w-[200px] h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                {PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {growthPeriod === "custom" && (
            <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">De</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left text-xs", !customFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {customFrom ? format(customFrom, "dd/MM/yyyy") : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Até</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("w-[140px] justify-start text-left text-xs", !customTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {customTo ? format(customTo, "dd/MM/yyyy") : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar mode="single" selected={customTo} onSelect={setCustomTo} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <Button size="sm" onClick={handleCustomDateApply} disabled={!customFrom || !customTo} className="rounded-lg">
                Aplicar
              </Button>
            </div>
          )}

          {loadingGrowth ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : growthData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="sessions" name="Mentorias" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                  <Line type="monotone" dataKey="new_mentors" name="Novos Mentores" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ fill: "hsl(var(--secondary))" }} />
                  <Line type="monotone" dataKey="new_mentees" name="Novos Mentorados" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado para o período selecionado.</p>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className={`border-border/50 ${hasAlerts ? "border-amber-500/30" : ""}`}>
        <CardHeader>
          <CardTitle className="text-base">⚠️ Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {hasAlerts ? (
            <div className="space-y-3">
              {alerts!.pending_48h > 0 && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span><strong>{alerts!.pending_48h}</strong> solicitações pendentes há mais de 48h</span>
                </div>
              )}

              {alerts!.noRequestsCount > 0 && (
                <div className="text-sm p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <Inbox className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span><strong>{alerts!.noRequestsCount}</strong> mentores sem solicitações (30+ dias sem receber pedidos)</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs shrink-0"
                      onClick={() => {
                        if (!noRequestDetails) fetchNoRequestDetails();
                        setShowNoReqDialog(true);
                      }}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              )}

              {alerts!.notRespondingCount > 0 && (
                <div className="text-sm p-3 rounded-lg bg-amber-500/10 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span><strong>{alerts!.notRespondingCount}</strong> mentores não responderam (pedidos pendentes)</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs shrink-0"
                      onClick={() => {
                        if (!notRespondingDetails) fetchNotRespondingDetails();
                        setShowNotRespDialog(true);
                      }}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              )}

              {healthMetrics.some((m) => m.type === "retention" && m.value < 50) && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>Taxa de retenção abaixo de 50%</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Nenhum alerta crítico no momento ✅
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-base">📋 Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            A plataforma conta com <strong className="text-foreground">{coreMetrics.totalMentees}</strong> mentorados e{" "}
            <strong className="text-foreground">{coreMetrics.totalMentors}</strong> mentores aprovados.
          </p>
          <p>
            Já foram realizadas <strong className="text-foreground">{coreMetrics.completedSessions}</strong> sessões de mentoria,
            impactando <strong className="text-foreground">{coreMetrics.livesImpacted}</strong> vidas únicas.
          </p>
          {coreMetrics.scheduledSessions > 0 && (
            <p>
              Atualmente há <strong className="text-foreground">{coreMetrics.scheduledSessions}</strong> sessões agendadas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── Dialogs ─── */}
      {/* No Requests Dialog */}
      <Dialog open={showNoReqDialog} onOpenChange={setShowNoReqDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5" />
              Mentores sem solicitações (30+ dias)
            </DialogTitle>
            <DialogDescription>
              Mentores aprovados que não receberam nenhum pedido de mentoria nos últimos 30 dias.
            </DialogDescription>
          </DialogHeader>
          {loadingNoReq ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : noRequestDetails && noRequestDetails.length > 0 ? (
            <div className="space-y-3">
              {noRequestDetails.map((m, i) => (
                <div key={m.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-medium text-sm">{i + 1}. {m.name}</p>
                  <p className="text-xs text-muted-foreground">Cadastrado há: <strong>{m.daysSince} dias</strong></p>
                  <p className="text-xs text-muted-foreground">Área: <strong>{m.area}</strong></p>
                  <p className="text-xs text-amber-600">Ação: Revisar perfil/tags ou promover mentor</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum mentor sem solicitações.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Not Responding Dialog */}
      <Dialog open={showNotRespDialog} onOpenChange={setShowNotRespDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mentores que não responderam
            </DialogTitle>
            <DialogDescription>
              Mentores com solicitações de mentoria pendentes (não confirmadas).
            </DialogDescription>
          </DialogHeader>
          {loadingNotResp ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : notRespondingDetails && notRespondingDetails.length > 0 ? (
            <div className="space-y-3">
              {notRespondingDetails.map((m, i) => (
                <div key={m.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-medium text-sm">{i + 1}. {m.name}</p>
                  <p className="text-xs text-muted-foreground">Solicitações pendentes: <strong>{m.pendingCount}</strong></p>
                  <p className="text-xs text-muted-foreground">Pedido mais antigo: <strong>{m.daysSince} dias atrás</strong></p>
                  <p className="text-xs text-muted-foreground">Área: <strong>{m.area}</strong></p>
                  <p className="text-xs text-amber-600">Ação: Contatar mentor</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum mentor com pendências.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Retention Details Dialog */}
      <Dialog open={showRetentionDialog} onOpenChange={setShowRetentionDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🔁 Mentorados que retornaram (2+ mentorias)
            </DialogTitle>
            <DialogDescription>
              {retentionDetails
                ? `${retentionDetails.length} mentorados voltaram para uma segunda (ou mais) mentoria.`
                : "Carregando..."}
            </DialogDescription>
          </DialogHeader>
          {loadingRetention ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : retentionDetails && retentionDetails.length > 0 ? (
            <div className="space-y-3">
              {retentionDetails.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-medium text-sm">{i + 1}. {m.name}</p>
                  <p className="text-xs text-muted-foreground">Total de mentorias: <strong>{m.totalSessions}</strong></p>
                  <p className="text-xs text-muted-foreground">
                    Última mentoria: <strong>{format(new Date(m.lastSession), "dd/MM/yyyy")}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mentores: <strong>{m.mentors.join(", ")}</strong>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum mentorado com 2+ mentorias ainda.</p>
          )}
        </DialogContent>
      </Dialog>
      {/* Trails & NPS Section */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">📊 Trilhas & NPS</h3>
        <AdminTrailsNpsPanel />
      </div>
    </div>
  );
};

export default AdminMetricsPanel;
