import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Users, UserCheck, GraduationCap, Calendar, CheckCircle, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Metrics {
  totalUsers: number;
  totalMentors: number;
  totalMentees: number;
  scheduledSessions: number;
  completedSessions: number;
  livesImpacted: number;
}

const AdminMetricsPanel = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      // Fetch all metrics in parallel
      const [
        profilesResult,
        mentorsResult,
        uniqueMenteesResult,
        futureScheduledResult,
        completedResult,
        livesImpactedResult
      ] = await Promise.all([
        // Total registered users (profiles)
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        // Total approved mentors
        supabase.from("mentors").select("id", { count: "exact", head: true }).eq("status", "approved"),
        // Total mentees (users who have booked at least one session)
        supabase.from("mentor_sessions").select("user_id"),
        // Future scheduled sessions (using RPC for accurate count)
        supabase.rpc("get_future_scheduled_sessions"),
        // Completed sessions (sessions past their end time, using RPC)
        supabase.rpc("get_total_completed_sessions"),
        // Lives impacted (unique mentees with completed sessions)
        supabase.rpc("get_lives_impacted"),
      ]);

      const uniqueMenteeCount = new Set(uniqueMenteesResult.data?.map(m => m.user_id) || []).size;

      setMetrics({
        totalUsers: profilesResult.count || 0,
        totalMentors: mentorsResult.count || 0,
        totalMentees: uniqueMenteeCount,
        scheduledSessions: futureScheduledResult.data ?? 0,
        completedSessions: completedResult.data ?? 0,
        livesImpacted: livesImpactedResult.data ?? 0,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <p className="text-muted-foreground text-center py-8">Erro ao carregar métricas</p>
    );
  }

  const metricCards = [
    {
      title: "Usuários Inscritos",
      value: metrics.totalUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Mentores Aprovados",
      value: metrics.totalMentors,
      icon: UserCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Mentorados Ativos",
      value: metrics.totalMentees,
      icon: GraduationCap,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Sessões Agendadas",
      value: metrics.scheduledSessions,
      icon: Calendar,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Sessões Realizadas",
      value: metrics.completedSessions,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Vidas Impactadas",
      value: metrics.livesImpacted,
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Métricas da Plataforma</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric) => (
          <Card key={metric.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary card */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            A plataforma conta com <strong className="text-foreground">{metrics.totalUsers}</strong> usuários registrados, 
            dos quais <strong className="text-foreground">{metrics.totalMentees}</strong> já agendaram pelo menos uma mentoria.
          </p>
          <p>
            Temos <strong className="text-foreground">{metrics.totalMentors}</strong> mentores aprovados 
            que já realizaram <strong className="text-foreground">{metrics.completedSessions}</strong> sessões de mentoria, 
            impactando <strong className="text-foreground">{metrics.livesImpacted}</strong> vidas únicas.
          </p>
          {metrics.scheduledSessions > 0 && (
            <p>
              Atualmente há <strong className="text-foreground">{metrics.scheduledSessions}</strong> sessões agendadas aguardando realização.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMetricsPanel;
