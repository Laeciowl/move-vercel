import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, Users, UserCheck, GraduationCap, Heart, 
  MessageSquare, TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle, RefreshCw, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from "recharts";

interface CoreMetrics {
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  completedSessions: number;
  completedThisMonth: number;
  completedLastMonth: number;
  livesImpacted: number;
  livesImpactedLastMonth: number;
  scheduledSessions: number;
}

interface HealthMetric {
  label: string;
  value: number;
  benchmarkGood: number;
  benchmarkAlert: number;
  suffix: string;
}

interface GrowthData {
  month: string;
  sessions: number;
  new_mentors: number;
  new_mentees: number;
}

interface Alerts {
  pending_48h: number;
  inactive_mentors: number;
  avg_mentorships_per_mentee: number;
  mentor_to_mentee_ratio: number;
}

const getStatusIcon = (value: number, good: number, alert: number) => {
  if (value >= good) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  if (value >= alert) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  return <AlertTriangle className="w-4 h-4 text-destructive" />;
};

const getStatusColor = (value: number, good: number, alert: number) => {
  if (value >= good) return "text-emerald-500";
  if (value >= alert) return "text-amber-500";
  return "text-destructive";
};

const getGrowthIndicator = (current: number, previous: number) => {
  if (previous === 0 && current > 0) return { pct: 100, icon: <ArrowUpRight className="w-4 h-4" />, color: "text-emerald-500" };
  if (previous === 0) return { pct: 0, icon: <Minus className="w-4 h-4" />, color: "text-muted-foreground" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { pct, icon: <ArrowUpRight className="w-4 h-4" />, color: "text-emerald-500" };
  if (pct < 0) return { pct, icon: <ArrowDownRight className="w-4 h-4" />, color: "text-destructive" };
  return { pct: 0, icon: <Minus className="w-4 h-4" />, color: "text-muted-foreground" };
};

const AdminMetricsPanel = () => {
  const [coreMetrics, setCoreMetrics] = useState<CoreMetrics | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAllMetrics = async () => {
    setLoading(true);
    try {
      const [
        profilesResult,
        mentorsResult,
        completedResult,
        livesResult,
        scheduledResult,
        activationResult,
        confirmationResult,
        completionResult,
        retentionResult,
        growthResult,
        alertsResult,
        // This month's sessions
        thisMonthResult,
        lastMonthResult,
        // This month's lives impacted
        livesThisMonthResult,
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
        supabase.rpc("get_monthly_growth"),
        supabase.rpc("get_admin_alerts"),
        // Sessions completed this month
        supabase.from("mentor_sessions")
          .select("id", { count: "exact", head: true })
          .eq("status", "scheduled")
          .gte("scheduled_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lt("scheduled_at", new Date().toISOString()),
        // Sessions completed last month
        supabase.from("mentor_sessions")
          .select("id", { count: "exact", head: true })
          .eq("status", "scheduled")
          .gte("scheduled_at", new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
          .lt("scheduled_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        // Lives impacted - approximate from growth data
        supabase.rpc("get_lives_impacted"),
      ]);

      const totalUsers = profilesResult.count || 0;
      const totalMentors = mentorsResult.count || 0;

      setCoreMetrics({
        totalUsers,
        totalMentors,
        totalMentees: totalUsers - totalMentors,
        completedSessions: completedResult.data ?? 0,
        completedThisMonth: thisMonthResult.count ?? 0,
        completedLastMonth: lastMonthResult.count ?? 0,
        livesImpacted: livesResult.data ?? 0,
        livesImpactedLastMonth: livesThisMonthResult.data ?? 0,
        scheduledSessions: scheduledResult.data ?? 0,
      });

      // Health metrics
      const activation = activationResult.data as any;
      const confirmation = confirmationResult.data as any;
      const completion = completionResult.data as any;
      const retention = retentionResult.data as any;

      setHealthMetrics([
        { label: "Taxa de Ativação (mentorados)", value: Number(activation?.rate ?? 0), benchmarkGood: 60, benchmarkAlert: 40, suffix: "%" },
        { label: "Taxa de Confirmação", value: Number(confirmation?.rate ?? 0), benchmarkGood: 75, benchmarkAlert: 60, suffix: "%" },
        { label: "Taxa de Conclusão", value: Number(completion?.rate ?? 0), benchmarkGood: 80, benchmarkAlert: 70, suffix: "%" },
        { label: "Taxa de Retenção (2ª mentoria)", value: Number(retention?.rate ?? 0), benchmarkGood: 50, benchmarkAlert: 30, suffix: "%" },
      ]);

      setGrowthData((growthResult.data as any) || []);
      setAlerts(alertsResult.data as any);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMetrics();
  }, []);

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

  const hasAlerts = alerts && (alerts.pending_48h > 0 || alerts.inactive_mentors > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">📊 Métricas Essenciais</h3>
        <Button variant="outline" size="sm" onClick={fetchAllMetrics} className="gap-2 rounded-xl">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Core Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Mentorias */}
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
              <p className="text-xs text-muted-foreground mt-1">
                {coreMetrics.scheduledSessions} agendadas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Impacto */}
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

        {/* Usuários */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">👥 Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{coreMetrics.totalUsers}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {coreMetrics.totalMentors} mentores · {coreMetrics.totalMentees} mentorados
            </p>
            {alerts && Number(alerts.mentor_to_mentee_ratio) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Proporção: 1 mentor para cada {alerts.mentor_to_mentee_ratio} usuários
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">🔥 Health Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${getStatusColor(metric.value, metric.benchmarkGood, metric.benchmarkAlert)}`}>
                    {metric.value}{metric.suffix}
                  </span>
                  {getStatusIcon(metric.value, metric.benchmarkGood, metric.benchmarkAlert)}
                </div>
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
      {growthData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">📈 Crescimento (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    name="Mentorias" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="new_mentors" 
                    name="Novos Mentores" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2} 
                    dot={{ fill: 'hsl(var(--secondary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="new_mentees" 
                    name="Novos Mentorados" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      <Card className={`border-border/50 ${hasAlerts ? 'border-amber-500/30' : ''}`}>
        <CardHeader>
          <CardTitle className="text-base">⚠️ Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          {hasAlerts ? (
            <div className="space-y-2">
              {alerts!.pending_48h > 0 && (
                <div className="flex items-start gap-2 text-sm p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span><strong>{alerts!.pending_48h}</strong> solicitações pendentes há mais de 48h</span>
                </div>
              )}
              {alerts!.inactive_mentors > 0 && (
                <div className="flex items-start gap-2 text-sm p-2 rounded-lg bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span><strong>{alerts!.inactive_mentors}</strong> mentores inativos (30+ dias sem aceitar)</span>
                </div>
              )}
              {healthMetrics.some(m => m.label.includes("Retenção") && m.value < 50) && (
                <div className="flex items-start gap-2 text-sm p-2 rounded-lg bg-amber-500/10">
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
    </div>
  );
};

export default AdminMetricsPanel;
