import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Clock,
  CheckCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { usePathsList, useMyPathProgress } from "@/hooks/usePaths";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";

const formatDuration = (minutes?: number) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `~${hours}h`;
  return `~${hours}h${mins}`;
};

const Trails = () => {
  const navigate = useNavigate();
  const { data: pathsData, isLoading: pathsLoading } = usePathsList();
  const { data: progressData, isLoading: progressLoading } =
    useMyPathProgress();

  const loading = pathsLoading || progressLoading;

  const paths = pathsData?.paths ?? [];
  const progressMap = Object.fromEntries(
    (progressData?.progress ?? []).map((p) => [p.path_id, p]),
  );

  const getPathState = (pathId: string): "not_started" | "in_progress" | "completed" => {
    const p = progressMap[pathId];
    if (!p) return "not_started";
    if (p.completed_at) return "completed";
    if (p.percent > 0) return "in_progress";
    return "not_started";
  };

  if (loading) {
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
        {/* Back button */}
        <button
          onClick={() => navigate("/inicio")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Trilhas de Desenvolvimento
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Aprenda habilidades essenciais através de jornadas guiadas passo a
            passo
          </p>
        </motion.div>

        {/* Path Cards */}
        <div className="space-y-4">
          {paths.map((path, index) => {
            const state = getPathState(path.id);
            const p = progressMap[path.id];

            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/trilhas/${path.id}`)}
                className={`bg-card/50 backdrop-blur-sm rounded-2xl border p-5 cursor-pointer hover:shadow-md transition-all group ${
                  state === "completed"
                    ? "border-green-500/30 hover:border-green-500/50"
                    : "border-border/30 hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  {path.icon ? (
                    <div className="text-3xl">{path.icon}</div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {path.title}
                      </h3>
                      {state === "completed" && (
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      )}
                    </div>
                    {path.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {path.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {path.estimated_duration_minutes && (
                        <>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(path.estimated_duration_minutes)}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>
                        {path.steps_count ?? path.steps?.length ?? 0} passos
                      </span>
                    </div>

                    {state === "in_progress" && p && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Seu progresso
                          </span>
                          <span className="font-medium text-foreground">
                            {p.completed_steps.length}/
                            {path.steps_count ?? path.steps?.length ?? 0} (
                            {p.percent}%)
                          </span>
                        </div>
                        <Progress value={p.percent} className="h-2" />
                      </div>
                    )}

                    <div className="mt-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                          state === "completed"
                            ? "text-green-600"
                            : "text-primary"
                        } group-hover:gap-2.5 transition-all`}
                      >
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

        {paths.length === 0 && (
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
