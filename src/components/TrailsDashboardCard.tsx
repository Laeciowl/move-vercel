import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, ChevronRight, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

interface TrailProgress {
  trilha_id: string;
  progresso_percentual: number;
  concluido_em: string | null;
  completed_steps: number;
  total_steps: number;
  titulo: string;
  icone: string;
}

const TrailsDashboardCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trails, setTrails] = useState<TrailProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchTrailProgress();
  }, [user]);

  const fetchTrailProgress = async () => {
    if (!user) return;

    const { data: progressData } = await supabase
      .from("progresso_trilha")
      .select("*, trilhas(titulo, icone)")
      .eq("mentorado_id", user.id)
      .is("concluido_em", null)
      .order("updated_at", { ascending: false })
      .limit(2);

    if (progressData && progressData.length > 0) {
      // Get step counts
      const trilhaIds = progressData.map(p => p.trilha_id);
      const { data: steps } = await supabase
        .from("passos_trilha")
        .select("trilha_id")
        .in("trilha_id", trilhaIds);

      const { data: completedSteps } = await supabase
        .from("progresso_passo")
        .select("passo_id, passos_trilha(trilha_id)")
        .eq("mentorado_id", user.id)
        .eq("completado", true);

      const stepCounts: Record<string, number> = {};
      steps?.forEach(s => { stepCounts[s.trilha_id] = (stepCounts[s.trilha_id] || 0) + 1; });

      const completedCounts: Record<string, number> = {};
      completedSteps?.forEach((cs: any) => {
        const tid = cs.passos_trilha?.trilha_id;
        if (tid) completedCounts[tid] = (completedCounts[tid] || 0) + 1;
      });

      setTrails(progressData.map(p => ({
        trilha_id: p.trilha_id,
        progresso_percentual: p.progresso_percentual,
        concluido_em: p.concluido_em,
        completed_steps: completedCounts[p.trilha_id] || 0,
        total_steps: stepCounts[p.trilha_id] || 0,
        titulo: (p as any).trilhas?.titulo || "Trilha",
        icone: (p as any).trilhas?.icone || "🎯",
      })));
    }

    setLoading(false);
  };

  if (loading) return null;

  // No active trails - show CTA
  if (trails.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 group hover:border-primary/30 transition-colors cursor-pointer"
        onClick={() => navigate("/trilhas")}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Trilhas de Desenvolvimento</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Comece uma jornada guiada!</p>
        <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
          Explorar trilhas <ChevronRight className="w-4 h-4" />
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Target className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Suas Trilhas</h3>
      </div>

      <div className="space-y-3">
        {trails.map(trail => (
          <div
            key={trail.trilha_id}
            onClick={() => navigate(`/trilhas/${trail.trilha_id}`)}
            className="cursor-pointer hover:bg-muted/30 rounded-xl p-3 -mx-1 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span>{trail.icone}</span>
              <span className="font-medium text-sm text-foreground">{trail.titulo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={trail.progresso_percentual} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">
                {trail.completed_steps}/{trail.total_steps} ({trail.progresso_percentual}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/trilhas")}
        className="text-sm text-primary font-medium flex items-center gap-1 mt-3 hover:gap-2 transition-all"
      >
        Ver todas as trilhas <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default TrailsDashboardCard;
