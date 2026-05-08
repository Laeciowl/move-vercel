import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, ChevronRight, Star } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { Progress } from "@/components/ui/progress";

const AchievementsDashboardCard = () => {
  const navigate = useNavigate();
  const { unlockedCount, totalCount, overallProgress, recentUnlocked, nextAchievement, loading } =
    useAchievements();

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-amber-500" />
        </div>
        <h3 className="font-semibold text-foreground">Conquistas</h3>
      </div>

      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-muted-foreground">
            {unlockedCount} de {totalCount} conquistadas
          </span>
          <span className="text-xs font-medium text-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-1.5" />
      </div>

      {/* Recent unlocked */}
      {recentUnlocked.length > 0 && (
        <div className="space-y-2 mb-3">
          {recentUnlocked.map((ach) => (
            <div
              key={ach.id}
              className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2"
            >
              <span className="text-lg shrink-0">{ach.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{ach.name}</p>
                <p className="text-xs text-muted-foreground truncate">{ach.description}</p>
              </div>
              <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Next achievement */}
      {nextAchievement && (
        <div className="bg-muted/30 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-muted-foreground mb-0.5">Próxima conquista</p>
          <div className="flex items-center gap-2">
            <span className="text-base shrink-0">{nextAchievement.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{nextAchievement.name}</p>
              <div className="mt-1">
                <Progress
                  value={
                    nextAchievement.criteria_value > 0
                      ? Math.round(
                          (nextAchievement.progress / nextAchievement.criteria_value) * 100
                        )
                      : 0
                  }
                  className="h-1"
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {nextAchievement.progress}/{nextAchievement.criteria_value}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/conquistas")}
        className="text-sm text-amber-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
      >
        Ver todas <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default AchievementsDashboardCard;
