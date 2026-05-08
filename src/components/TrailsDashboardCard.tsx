import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, ChevronRight } from "lucide-react";
import { usePathsList } from "@/hooks/usePaths";
import { Progress } from "@/components/ui/progress";

const TrailsDashboardCard = () => {
  const navigate = useNavigate();
  const { trails, loading } = usePathsList();

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
        {trails.map((trail) => (
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
