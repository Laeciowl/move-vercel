import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Target, Clock, Users, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";

interface Trail {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  duracao_estimada_minutos: number;
  ordem: number;
  steps_count: number;
}

interface TrailProgress {
  trilha_id: string;
  progresso_percentual: number;
  concluido_em: string | null;
  completed_steps: number;
}

const Trails = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [progress, setProgress] = useState<Record<string, TrailProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    // Fetch trails
    const { data: trailsData } = await supabase
      .from("trilhas")
      .select("*")
      .eq("ativo", true)
      .order("ordem");

    if (trailsData) {
      // Count steps per trail
      const { data: stepsData } = await supabase
        .from("passos_trilha")
        .select("trilha_id");

      const stepCounts: Record<string, number> = {};
      stepsData?.forEach(s => {
        stepCounts[s.trilha_id] = (stepCounts[s.trilha_id] || 0) + 1;
      });

      setTrails(trailsData.map(t => ({
        ...t,
        steps_count: stepCounts[t.id] || 0,
      })));
    }

    // Fetch user progress
    if (user) {
      const { data: progressData } = await supabase
        .from("progresso_trilha")
        .select("*")
        .eq("mentorado_id", user.id);

      if (progressData) {
        // Count completed steps per trail
        const { data: stepProgress } = await supabase
          .from("progresso_passo")
          .select("passo_id, completado, passos_trilha(trilha_id)")
          .eq("mentorado_id", user.id)
          .eq("completado", true);

        const completedByTrail: Record<string, number> = {};
        stepProgress?.forEach((sp: any) => {
          const tid = sp.passos_trilha?.trilha_id;
          if (tid) completedByTrail[tid] = (completedByTrail[tid] || 0) + 1;
        });

        const progressMap: Record<string, TrailProgress> = {};
        progressData.forEach(p => {
          progressMap[p.trilha_id] = {
            trilha_id: p.trilha_id,
            progresso_percentual: p.progresso_percentual,
            concluido_em: p.concluido_em,
            completed_steps: completedByTrail[p.trilha_id] || 0,
          };
        });
        setProgress(progressMap);
      }
    }

    setLoading(false);
  };

  const getTrailState = (trailId: string) => {
    const p = progress[trailId];
    if (!p) return "not_started";
    if (p.concluido_em) return "completed";
    return "in_progress";
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `~${hours}h`;
    return `~${hours}h${mins}`;
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Trilhas de Desenvolvimento</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Aprenda habilidades essenciais através de jornadas guiadas passo a passo
          </p>
        </motion.div>

        {/* Trail Cards */}
        <div className="space-y-4">
          {trails.map((trail, index) => {
            const state = getTrailState(trail.id);
            const p = progress[trail.id];

            return (
              <motion.div
                key={trail.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/trilhas/${trail.id}`)}
                className={`bg-card/50 backdrop-blur-sm rounded-2xl border p-5 cursor-pointer hover:shadow-md transition-all group ${
                  state === "completed"
                    ? "border-green-500/30 hover:border-green-500/50"
                    : "border-border/30 hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{trail.icone}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">{trail.titulo}</h3>
                      {state === "completed" && (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{trail.descricao}</p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(trail.duracao_estimada_minutos)}
                      </span>
                      <span>•</span>
                      <span>{trail.steps_count} passos</span>
                    </div>

                    {state === "in_progress" && p && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Seu progresso</span>
                          <span className="font-medium text-foreground">
                            {p.completed_steps}/{trail.steps_count} ({p.progresso_percentual}%)
                          </span>
                        </div>
                        <Progress value={p.progresso_percentual} className="h-2" />
                      </div>
                    )}

                    <div className="mt-3">
                      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                        state === "completed" ? "text-green-600" : "text-primary"
                      } group-hover:gap-2.5 transition-all`}>
                        {state === "not_started" && "Começar trilha"}
                        {state === "in_progress" && "Continuar trilha"}
                        {state === "completed" && "Revisar trilha"}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {trails.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma trilha disponível no momento.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Trails;
