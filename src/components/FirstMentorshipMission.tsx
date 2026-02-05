import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, ArrowRight, CheckCircle2, Sparkles, Trophy, Rocket, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface FirstMentorshipMissionProps {
  isCompleted: boolean;
}

const FirstMentorshipMission = ({ isCompleted }: FirstMentorshipMissionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completedSessions, setCompletedSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isCompleted) {
      setLoading(false);
      return;
    }

    // Fetch completed sessions count for the user
    const fetchCompletedSessions = async () => {
      const { count, error } = await supabase
        .from("mentor_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (!error && count !== null) {
        setCompletedSessions(count);
      }
      setLoading(false);
    };

    fetchCompletedSessions();
  }, [user, isCompleted]);

  // Calculate next milestone
  const getNextMilestone = () => {
    if (completedSessions < 3) return { target: 3, label: "3 mentorias" };
    if (completedSessions < 5) return { target: 5, label: "5 mentorias" };
    if (completedSessions < 10) return { target: 10, label: "10 mentorias" };
    return null;
  };

  const nextMilestone = getNextMilestone();

  if (!isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-orange-500/5 to-amber-500/10 border border-primary/20 p-5"
      >
        {/* Animated background glow */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-start gap-4">
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-button flex-shrink-0"
            >
              <Target className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-foreground">Sua primeira missão</h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  Pendente
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Agende sua primeira sessão de mentoria e dê o primeiro passo na sua jornada de desenvolvimento profissional!
              </p>

              <div className="flex items-center gap-3 mt-4">
                <Button
                  onClick={() => navigate("/mentores")}
                  size="sm"
                  className="rounded-xl bg-gradient-hero text-primary-foreground shadow-button hover:opacity-90 gap-2"
                >
                  Encontrar mentor
                  <ArrowRight className="w-4 h-4" />
                </Button>
                
                <span className="text-xs text-muted-foreground">
                  ✨ É grátis e transforma carreiras
                </span>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso da missão</span>
              <span className="text-primary font-medium">0/1 mentoria</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-hero"
                initial={{ width: 0 }}
                animate={{ width: "5%" }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // After first mentorship is completed, show next goals
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 p-5"
    >
      {/* Celebration particles */}
      {completedSessions === 1 && (
        <motion.div
          animate={{ opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: 3 }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: "50%", 
                y: "50%", 
                scale: 0 
              }}
              animate={{ 
                x: `${20 + Math.random() * 60}%`, 
                y: `${20 + Math.random() * 60}%`,
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 1.5, 
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute w-2 h-2 bg-green-400 rounded-full"
            />
          ))}
        </motion.div>
      )}

      <div className="flex items-start gap-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0"
        >
          {nextMilestone ? (
            <Rocket className="w-6 h-6 text-green-600" />
          ) : (
            <Trophy className="w-6 h-6 text-green-600" />
          )}
        </motion.div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-green-700 dark:text-green-400">
              {completedSessions === 1 
                ? "Primeira missão concluída! 🎉"
                : nextMilestone 
                  ? `${completedSessions} mentorias realizadas!`
                  : "Você é incrível! 🏆"}
            </h3>
            {completedSessions === 1 && (
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                <Sparkles className="w-4 h-4 text-green-600" />
              </motion.span>
            )}
          </div>
          
          {nextMilestone ? (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {completedSessions === 1 
                  ? "Parabéns pelo primeiro passo! Que tal continuar evoluindo?"
                  : "Continue impactando sua carreira!"}
              </p>
              
              {/* Next milestone progress */}
              <div className="bg-card/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-primary" />
                    Próxima meta: {nextMilestone.label}
                  </span>
                  <span className="font-medium text-foreground">
                    {completedSessions}/{nextMilestone.target}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedSessions / nextMilestone.target) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextMilestone.target - completedSessions === 1 
                    ? "Falta apenas 1 mentoria!"
                    : `Faltam ${nextMilestone.target - completedSessions} mentorias`}
                </p>
              </div>

              <Button
                onClick={() => navigate("/mentores")}
                size="sm"
                variant="outline"
                className="rounded-xl gap-2 border-green-500/30 text-green-700 hover:bg-green-500/10"
              >
                Agendar próxima mentoria
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                Você completou 10 mentorias! Continue explorando novos mentores e áreas.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Meta de 10 mentorias alcançada!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FirstMentorshipMission;
