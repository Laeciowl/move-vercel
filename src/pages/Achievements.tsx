import { motion } from "framer-motion";
import { Trophy, Lock, Star, BarChart3, Loader2, Share2, ChevronRight, Linkedin, ArrowLeft } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const categoryLabels: Record<string, string> = {
  mentorias: "Mentorias Realizadas",
  tempo: "Tempo Investido",
  impacto: "Vidas Transformadas",
  consistencia: "Consistência",
  conteudo: "Conteúdos e Aprendizado",
  exploracao: "Exploração",
  areas: "Diversidade de Áreas",
  preparacao: "Preparação",
  engajamento: "Engajamento",
  especial: "Conquistas Especiais",
};

const categoryIcons: Record<string, string> = {
  mentorias: "🎯",
  tempo: "⏱️",
  impacto: "🌱",
  consistencia: "🔥",
  conteudo: "📚",
  exploracao: "🔍",
  areas: "🏷️",
  preparacao: "✅",
  engajamento: "⭐",
  especial: "🏆",
};

const Achievements = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    achievementsByCategory,
    stats,
    unlockedCount,
    totalCount,
    overallProgress,
    nextAchievement,
    loading,
    userType,
  } = useAchievements();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (loading || authLoading) {
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        {/* Back button */}
        <button
          onClick={() => navigate("/inicio")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-button">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Suas Conquistas</h1>
            <p className="text-sm text-muted-foreground">
              {unlockedCount} de {totalCount} conquistas desbloqueadas
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Progresso Geral</span>
            <span className="text-sm font-bold text-primary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Suas Estatísticas</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Mentorias" value={stats.totalMentorias} icon="🎯" />
            <StatCard
              label={`Tempo ${userType === "mentor" ? "mentorado" : "aprendendo"}`}
              value={`${Math.floor(stats.totalMinutes / 60)}h${stats.totalMinutes % 60 > 0 ? `${stats.totalMinutes % 60}min` : ""}`}
              icon="⏱️"
            />
            <StatCard
              label={userType === "mentor" ? "Vidas transformadas" : "Mentores conhecidos"}
              value={stats.uniqueContacts}
              icon={userType === "mentor" ? "🌱" : "🔍"}
            />
            {userType === "mentorado" && (
              <StatCard label="Áreas exploradas" value={stats.areasExplored} icon="🏷️" />
            )}
            {userType === "mentor" && (
              <StatCard label="Conquistas" value={unlockedCount} icon="🏆" />
            )}
          </div>
        </motion.div>

        {/* Next Achievement Hint */}
        {nextAchievement && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-2xl p-4 border border-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{nextAchievement.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  💡 Próxima conquista: <strong>{nextAchievement.name}</strong>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={nextAchievement.criteria_value > 0
                      ? (nextAchievement.progress / nextAchievement.criteria_value) * 100
                      : 0}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {nextAchievement.progress}/{nextAchievement.criteria_value}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Achievement Categories */}
        {Object.entries(achievementsByCategory).map(([category, achs], catIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + catIndex * 0.05 }}
            className="space-y-3"
          >
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <span>{categoryIcons[category] || "🏆"}</span>
              {categoryLabels[category] || category}
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              {achs.map((ach, i) => (
                <AchievementCard key={ach.id} achievement={ach} index={i} />
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AppLayout>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: string | number; icon: string }) => (
  <div className="bg-muted/30 rounded-xl p-3 text-center">
    <span className="text-lg">{icon}</span>
    <div className="text-xl font-bold text-foreground mt-1">{value}</div>
    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
  </div>
);

interface AchievementCardProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    criteria_value: number;
    progress: number;
    isUnlocked: boolean;
    unlocked_at: string | null;
  };
  index: number;
}

const AchievementCard = ({ achievement, index }: AchievementCardProps) => {
  const progressPct = achievement.criteria_value > 0
    ? Math.min((achievement.progress / achievement.criteria_value) * 100, 100)
    : 0;

  const shareOnLinkedIn = () => {
    const text = `🏆 Acabei de desbloquear a conquista "${achievement.name}" na plataforma Movê!\n\n${achievement.icon} ${achievement.description}\n\nA Movê conecta jovens a mentores voluntários para orientação profissional gratuita.\n\n#Movê #Mentoria #DesenvolvimentoProfissional`;
    const url = "https://movesocial.lovable.app";
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      "_blank",
      "width=600,height=500"
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border p-4 transition-all ${
        achievement.isUnlocked
          ? "bg-card/80 border-primary/20 shadow-soft"
          : "bg-muted/20 border-border/30 opacity-70"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${achievement.isUnlocked ? "" : "grayscale"}`}>
          {achievement.isUnlocked ? achievement.icon : "🔒"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold text-sm ${achievement.isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
              {achievement.name}
            </h4>
            {achievement.isUnlocked && (
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5">
                ✓
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>

          {!achievement.isUnlocked && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>{achievement.progress}/{achievement.criteria_value}</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-primary/60 rounded-full"
                />
              </div>
            </div>
          )}

          {achievement.isUnlocked && (
            <div className="flex items-center justify-between mt-1.5">
              {achievement.unlocked_at && (
                <p className="text-[10px] text-muted-foreground">
                  Desbloqueado em {new Date(achievement.unlocked_at).toLocaleDateString("pt-BR")}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={shareOnLinkedIn}
                className="h-6 px-2 text-[10px] text-[#0A66C2] hover:bg-[#0A66C2]/10 gap-1"
              >
                <Linkedin className="w-3 h-3" />
                Compartilhar
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Achievements;
