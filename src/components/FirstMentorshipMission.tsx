import { motion } from "framer-motion";
import { Target, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FirstMentorshipMissionProps {
  isCompleted: boolean;
}

const FirstMentorshipMission = ({ isCompleted }: FirstMentorshipMissionProps) => {
  const navigate = useNavigate();

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 p-5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-green-700 dark:text-green-400">Missão cumprida! 🎉</h3>
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Você agendou sua primeira mentoria. Continue explorando!
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

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
};

export default FirstMentorshipMission;
