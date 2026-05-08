import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, ChevronRight, Calendar, CheckCircle2 } from "lucide-react";
import { useMyMentorSessions } from "@/hooks/useMentorSessions";

const ProgressDashboardCard = () => {
  const navigate = useNavigate();
  const { completedCount, upcomingSessions, loading } = useMyMentorSessions();

  if (loading) return null;

  const nextSession = upcomingSessions[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <h3 className="font-semibold text-foreground">Seu Progresso</h3>
      </div>

      {/* Completed sessions count */}
      <div className="flex items-center gap-3 mb-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2.5">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            {completedCount}{" "}
            {completedCount === 1 ? "mentoria realizada" : "mentorias realizadas"}
          </p>
          {completedCount === 0 && (
            <p className="text-xs text-muted-foreground">Sua primeira mentoria te espera!</p>
          )}
          {completedCount > 0 && completedCount < 5 && (
            <p className="text-xs text-muted-foreground">
              Falta {5 - completedCount} para o próximo marco!
            </p>
          )}
          {completedCount >= 5 && (
            <p className="text-xs text-muted-foreground">Continue assim!</p>
          )}
        </div>
      </div>

      {/* Next upcoming session */}
      {nextSession && (
        <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-3 py-2.5 mb-3">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Próxima mentoria</p>
            <p className="text-sm font-medium text-foreground">
              {new Date(nextSession.scheduled_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}

      {!nextSession && completedCount === 0 && (
        <button
          onClick={() => navigate("/mentores")}
          className="w-full text-sm bg-primary/10 text-primary font-medium py-2 rounded-xl hover:bg-primary/20 transition-colors mb-3"
        >
          Agendar primeira mentoria
        </button>
      )}

      <button
        onClick={() => navigate("/mentorias")}
        className="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
      >
        Ver mentorias <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default ProgressDashboardCard;
