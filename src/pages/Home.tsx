import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, User, Calendar, Users, Trophy, BookOpen, ArrowRight,
  Clock, Sparkles, Heart, Shield, Edit, RefreshCw, History,
  MessageCircle, Briefcase, Settings, LogOut, ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { useMentorCheck } from "@/hooks/useMentorCheck";
import { usePendingMentorCheck } from "@/hooks/usePendingMentorCheck";
import { useAchievements } from "@/hooks/useAchievements";
import AppLayout from "@/components/AppLayout";
import ProfileEditModal from "@/components/ProfileEditModal";
import InterestsNotificationBanner from "@/components/InterestsNotificationBanner";
import InterestsOnboardingModal from "@/components/InterestsOnboardingModal";
import FirstMentorshipMission from "@/components/FirstMentorshipMission";
import PendingMentorBanner from "@/components/PendingMentorBanner";
import VolunteerPanel from "@/components/VolunteerPanel";
import MentorPanel from "@/components/MentorPanel";
import MentorshipSection from "@/components/MentorshipSection";
import OnboardingTour from "@/components/OnboardingTour";
import MenteeInterestsEditor from "@/components/MenteeInterestsEditor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import ReferralSection from "@/components/ReferralSection";
import type { Enums } from "@/integrations/supabase/types";

type ProfessionalStatus = Enums<"professional_status">;

const professionalStatusLabels: Record<string, string> = {
  desempregado: "Desempregado",
  estudante: "Estudante",
  estagiario: "Estagiário",
  empregado: "Empregado",
  freelancer_pj: "Freelancer / PJ",
};

const professionalStatusOptions = [
  { value: "desempregado", label: "Desempregado" },
  { value: "estudante", label: "Estudante" },
  { value: "estagiario", label: "Estagiário" },
  { value: "empregado", label: "Empregado" },
  { value: "freelancer_pj", label: "Freelancer / PJ" },
];

const Home = () => {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { isVolunteer } = useVolunteerCheck();
  const { isMentor } = useMentorCheck();
  const { isPendingMentor } = usePendingMentorCheck();
  const { recentUnlocked, nextAchievement, stats, overallProgress, unlockedCount, totalCount, userType } = useAchievements();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInterestsOnboarding, setShowInterestsOnboarding] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateData, setUpdateData] = useState({ professionalStatus: "" });
  const [impactHistory, setImpactHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("editarPerfil") === "1") {
      setShowProfileEdit(true);
      params.delete("editarPerfil");
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (profile) {
      setUpdateData({ professionalStatus: profile.professional_status });
      if (!profile.onboarding_completed && !isVolunteer) setShowOnboarding(true);
    }
  }, [profile, isVolunteer]);

  useEffect(() => {
    if (!user) return;
    supabase.from("impact_history").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false })
      .then(({ data }) => { if (data) setImpactHistory(data); });
  }, [user]);

  const handleUpdateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setUpdating(true);
    const { error } = await supabase.from("profiles").update({ professional_status: updateData.professionalStatus as ProfessionalStatus }).eq("user_id", user.id);
    if (error) toast.error("Erro ao atualizar: " + error.message);
    else {
      toast.success("Atualizado! Que bom ver sua evolução 💪");
      await refreshProfile();
      const { data } = await supabase.from("impact_history").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false });
      if (data) setImpactHistory(data);
      setShowUpdateForm(false);
    }
    setUpdating(false);
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center shadow-button">
            <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <motion.div
        initial="initial"
        animate="animate"
        variants={{ initial: {}, animate: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-6"
      >
        {/* Welcome */}
        <motion.div
          variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
          className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30"
        >
          <div className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.button onClick={() => setShowProfileEdit(true)} className="relative group" whileHover={{ scale: 1.05 }}>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-hero flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                    {profile.photo_url ? (
                      <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                    )}
                  </div>
                </motion.button>
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                    Olá, {profile.name.split(" ")[0]}! 👋
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isVolunteer ? (
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        Obrigado por transformar vidas
                      </span>
                    ) : "Bora crescer juntos!"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isVolunteer && (
                  <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full bg-muted/60 font-medium">
                    {professionalStatusLabels[profile.professional_status]}
                  </Badge>
                )}
                {isVolunteer && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 rounded-full font-medium">
                    <Heart className="w-3 h-3 mr-1" /> Voluntário
                  </Badge>
                )}
                {isAdmin && (
                  <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs px-3 py-1 rounded-full font-medium">
                    <Shield className="w-3 h-3 mr-1" /> Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats + Achievements Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Achievements Preview - Compact */}
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="col-span-2 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Conquistas</h3>
              <Link to="/conquistas" className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{unlockedCount}/{totalCount}</span>
                  <span className="font-medium text-primary">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            </div>
            {recentUnlocked.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {recentUnlocked.slice(0, 3).map(ach => (
                  <span key={ach.id} className="text-sm" title={ach.name}>{ach.icon}</span>
                ))}
              </div>
            )}
            {nextAchievement && (
              <p className="text-xs text-muted-foreground mt-2">
                💡 Próxima: <strong className="text-foreground">{nextAchievement.name}</strong>
              </p>
            )}
          </motion.div>

          {/* Quick Stats */}
          {!isVolunteer && (
            <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 flex flex-col items-center justify-center text-center"
            >
              <span className="text-2xl font-bold text-primary">{stats.totalMentorias}</span>
              <span className="text-xs text-muted-foreground">Mentorias</span>
            </motion.div>
          )}
          {!isVolunteer && (
            <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 flex flex-col items-center justify-center text-center"
            >
              <span className="text-2xl font-bold text-primary">{Math.round(stats.totalMinutes / 60 * 10) / 10}h</span>
              <span className="text-xs text-muted-foreground">Aprendizado</span>
            </motion.div>
          )}
          {isVolunteer && (
            <>
              <motion.div
                variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 flex flex-col items-center justify-center text-center"
              >
                <span className="text-2xl font-bold text-primary">{stats.totalMentorias}</span>
                <span className="text-xs text-muted-foreground">Mentorias</span>
              </motion.div>
              <motion.div
                variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 flex flex-col items-center justify-center text-center"
              >
                <span className="text-2xl font-bold text-primary">{stats.uniqueContacts}</span>
                <span className="text-xs text-muted-foreground">Vidas impactadas</span>
              </motion.div>
            </>
          )}
        </div>

        {/* Quick Links Row */}
        <div className={`grid gap-3 ${isVolunteer ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {/* Community */}
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 hover:border-green-500/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Comunidade</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">Grupo geral para trocar ideias e se conectar.</p>
            <a href="https://chat.whatsapp.com/BFDDkhbwz5aFdg6WhIFU6C" target="_blank" rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 bg-green-600 text-white py-2 rounded-xl font-medium text-xs hover:bg-green-700 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> Entrar
            </a>
          </motion.div>

          {/* TEM VAGA? - only for mentees */}
          {!isVolunteer && !isPendingMentor && (
            <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 hover:border-blue-500/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">TEM VAGA?</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">Vagas de estágio e cargos iniciais para jovens talentos.</p>
              <a href="https://chat.whatsapp.com/JugF130879CH7Lgo2Ycs1b" target="_blank" rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-xl font-medium text-xs hover:bg-blue-700 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> Entrar
              </a>
            </motion.div>
          )}

          {/* Mentors Group - only for volunteers */}
          {isVolunteer && (
            <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Mentores</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">Grupo exclusivo para mentores Movê.</p>
              <a href="https://chat.whatsapp.com/LKpz2hr7FnZDpCgNXdxwHl" target="_blank" rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 bg-purple-600 text-white py-2 rounded-xl font-medium text-xs hover:bg-purple-700 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> Entrar
              </a>
            </motion.div>
          )}

          {/* Minha Agenda - only for mentors */}
          {isMentor && (
            <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => navigate("/mentor/agenda")}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Minha Agenda</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">Gerencie suas sessões e disponibilidade.</p>
              <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Abrir agenda
              </Button>
            </motion.div>
          )}

          {/* About */}
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">Sobre o Movê</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-1">Conectamos jovens a mentores.</p>
            <div className="flex gap-2 text-[10px]">
              <a href="https://www.linkedin.com/in/laecio-rodrigues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@laecio</a>
              <a href="/termos" className="text-muted-foreground hover:text-foreground">Termos</a>
            </div>
          </motion.div>

        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Interests Banner */}
          {!isVolunteer && !isPendingMentor && (
            <InterestsNotificationBanner onOpenInterestsEditor={() => setShowInterestsOnboarding(true)} />
          )}

          {/* First Mission */}
          {!isVolunteer && !isPendingMentor && (
            <FirstMentorshipMission isCompleted={profile?.first_mentorship_booked || false} />
          )}

          {isPendingMentor && !isVolunteer && <PendingMentorBanner />}

          <VolunteerPanel />

          {!isVolunteer && !isMentor && !isPendingMentor && <MentorPanel />}

          {(!isVolunteer || isMentor) && <MentorshipSection />}

          {/* Evolution + Interests side-by-side on desktop */}
          {!isVolunteer && !isPendingMentor && (
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div
                variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Sua evolução</h3>
                </div>
                {showUpdateForm ? (
                  <form onSubmit={handleUpdateJourney} className="space-y-3">
                    <select
                      value={updateData.professionalStatus}
                      onChange={(e) => setUpdateData({ ...updateData, professionalStatus: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {professionalStatusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowUpdateForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" size="sm" disabled={updating} className="flex-1 rounded-xl bg-primary hover:bg-primary/90">
                        {updating && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />} Salvar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setShowUpdateForm(true)} className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" /> Atualizar status
                  </Button>
                )}
              </motion.div>

              <motion.div
                variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
              >
                <MenteeInterestsEditor />
              </motion.div>
            </div>
          )}

          {!isVolunteer && <ReferralSection />}
        </div>
      </motion.div>

      {/* Modals */}
      <ProfileEditModal isOpen={showProfileEdit} onClose={() => setShowProfileEdit(false)} profile={profile} onProfileUpdated={refreshProfile} />
      {showOnboarding && <OnboardingTour onComplete={() => { setShowOnboarding(false); refreshProfile(); }} />}
      <InterestsOnboardingModal open={showInterestsOnboarding} onClose={() => setShowInterestsOnboarding(false)} />
    </AppLayout>
  );
};

export default Home;
