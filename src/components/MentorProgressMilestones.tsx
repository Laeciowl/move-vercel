import { motion } from "framer-motion";
import { Award, Star, Trophy, Crown, Sparkles } from "lucide-react";

interface MentorProgressMilestonesProps {
  completedSessions: number;
  maxSessions?: number;
}

const milestones = [
  { value: 1, icon: Star, label: "Primeira!", color: "text-amber-500" },
  { value: 3, icon: Award, label: "3 vidas", color: "text-blue-500" },
  { value: 5, icon: Trophy, label: "5 vidas", color: "text-purple-500" },
  { value: 7, icon: Crown, label: "7 vidas", color: "text-orange-500" },
  { value: 10, icon: Sparkles, label: "10 vidas", color: "text-primary" },
];

const MentorProgressMilestones = ({ completedSessions, maxSessions = 10 }: MentorProgressMilestonesProps) => {
  const progressPercentage = Math.min((completedSessions / maxSessions) * 100, 100);

  return (
    <div className="space-y-3">
      {/* Progress bar with milestones */}
      <div className="relative">
        {/* Track */}
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-hero rounded-full relative"
          >
            {/* Shine effect */}
            <motion.div
              animate={{ x: [-100, 200] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            />
          </motion.div>
        </div>

        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center">
          {milestones.map((milestone, index) => {
            const position = (milestone.value / maxSessions) * 100;
            const isAchieved = completedSessions >= milestone.value;
            const Icon = milestone.icon;

            return (
              <motion.div
                key={milestone.value}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.1, type: "spring", stiffness: 300 }}
                className="absolute -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div className="relative group">
                  {/* Marker dot/icon */}
                  <motion.div
                    animate={isAchieved ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isAchieved 
                        ? "bg-card shadow-md border-2 border-primary" 
                        : "bg-muted border-2 border-border"
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isAchieved ? milestone.color : "text-muted-foreground"}`} />
                  </motion.div>

                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-popover text-popover-foreground px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-md border border-border">
                      {milestone.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Current progress text */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {completedSessions === 0 ? (
            "Sua primeira mentoria te espera! 🚀"
          ) : completedSessions < 3 ? (
            `Falta ${3 - completedSessions} para o próximo marco!`
          ) : completedSessions < 5 ? (
            `Incrível! Falta ${5 - completedSessions} para 5 vidas impactadas!`
          ) : completedSessions < 7 ? (
            `Você é demais! Falta ${7 - completedSessions} para 7 vidas!`
          ) : completedSessions < 10 ? (
            `Quase lá! Falta ${10 - completedSessions} para a meta!`
          ) : (
            "🏆 Você alcançou a meta de 10 mentorias!"
          )}
        </span>
        <span className="font-semibold text-foreground">
          {completedSessions}/{maxSessions}
        </span>
      </div>

      {/* Achievement celebration for first milestone */}
      {completedSessions >= 1 && completedSessions < 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-xl text-xs"
        >
          <Star className="w-4 h-4" />
          <span>Parabéns pela primeira mentoria! Continue assim! 🌟</span>
        </motion.div>
      )}
    </div>
  );
};

export default MentorProgressMilestones;
