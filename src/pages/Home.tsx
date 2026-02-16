import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2, User, Calendar, Users, Trophy, BookOpen, ArrowRight,
  Clock, Sparkles, Heart, Shield, Edit, RefreshCw, History,
  MessageCircle, Briefcase, Settings, LogOut, ExternalLink, Handshake,
  AlertCircle, Lightbulb, TrendingUp, TrendingDown, Minus, Camera, Target } from
"lucide-react";
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
  freelancer_pj: "Freelancer / PJ"
};

const professionalStatusOptions = [
{ value: "desempregado", label: "Desempregado" },
{ value: "estudante", label: "Estudante" },
{ value: "estagiario", label: "Estagiário" },
{ value: "empregado", label: "Empregado" },
{ value: "freelancer_pj", label: "Freelancer / PJ" }];


// Contextual message logic
const getContextualMessage = (
profile: any,
stats: any,
hasUpcomingSoon: boolean,
upcomingMentorName: string | null,
hasPendingConfirmation: boolean,
lastSessionDaysAgo: number | null,
lastActivityDaysAgo: number | null,
isVolunteer: boolean)
: string => {
  if (isVolunteer) return "Obrigado por transformar vidas ✨";

  // 9. Pending confirmation
  if (hasPendingConfirmation) return "Não esqueça de confirmar se sua última mentoria aconteceu ✓";

  // 8. Upcoming within 48h
  if (hasUpcomingSoon && upcomingMentorName) return `Sua mentoria com ${upcomingMentorName} é em breve! Já se preparou?`;
  if (hasUpcomingSoon) return "Sua próxima mentoria está chegando. Já se preparou? 📚";

  // 4. First session completed recently
  if (stats.totalMentorias === 1 && lastSessionDaysAgo !== null && lastSessionDaysAgo <= 3) return "Parabéns pela primeira mentoria! 🎉 Como foi a experiência?";

  // 1. Brand new user
  if (stats.totalMentorias === 0 && (!profile.photo_url || !profile.description)) return "Bem-vindo! Complete seu perfil e agende sua primeira mentoria 🚀";

  // 2. Profile complete, no sessions
  if (stats.totalMentorias === 0) return "Pronto para começar! Que tal agendar sua primeira mentoria?";

  // 3. First session scheduled (waiting)
  if (stats.totalMentorias === 0 && hasUpcomingSoon) return "Show! Sua primeira mentoria está chegando. Vamos nos preparar? 📚";

  // 7. Inactive 14+ days
  if (lastActivityDaysAgo !== null && lastActivityDaysAgo >= 14) return "Sentimos sua falta! Que tal agendar uma nova mentoria?";

  // 6. 6+ sessions
  if (stats.totalMentorias >= 6) return "Você está arrasando! 🔥 Sua dedicação inspira";

  // 5. 2-5 sessions
  if (stats.totalMentorias >= 2) return "Você está no caminho certo! Continue assim 💪";

  // 10. Fallback
  return "Bora crescer juntos! 💙";
};

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

  // Contextual message state
  const [contextMsg, setContextMsg] = useState("Bora crescer juntos! 💙");
  const [hasUpcomingSoon, setHasUpcomingSoon] = useState(false);
  const [upcomingMentorName, setUpcomingMentorName] = useState<string | null>(null);
  const [hasPendingConfirmation, setHasPendingConfirmation] = useState(false);
  const [lastSessionDaysAgo, setLastSessionDaysAgo] = useState<number | null>(null);
  const [lastActivityDaysAgo, setLastActivityDaysAgo] = useState<number | null>(null);

  // Monthly comparison state
  const [monthlyComparison, setMonthlyComparison] = useState<{mentorias: number;hours: number;}>({ mentorias: 0, hours: 0 });

  // Profile completeness
  const [missingProfileItems, setMissingProfileItems] = useState<string[]>([]);
  const [hasInterests, setHasInterests] = useState(true);

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

      // Check profile completeness
      const missing: string[] = [];
      if (!profile.photo_url) missing.push("Foto de perfil");
      if (!profile.description) missing.push("Sobre você / Bio");
      setMissingProfileItems(missing);
    }
  }, [profile, isVolunteer]);

  // Check interests
  useEffect(() => {
    if (!user || isVolunteer) return;
    supabase.from("mentee_interests").select("id").eq("user_id", user.id).limit(1).
    then(({ data }) => {
      const has = !!(data && data.length > 0);
      setHasInterests(has);
      if (!has) {
        setMissingProfileItems((prev) => {
          if (!prev.includes("Áreas de interesse")) return [...prev, "Áreas de interesse"];
          return prev;
        });
      }
    });
  }, [user, isVolunteer]);

  // Fetch contextual data
  useEffect(() => {
    if (!user || !profile) return;
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Check upcoming sessions within 48h
    supabase.from("mentor_sessions").select("scheduled_at, mentor_id, mentors(name)").
    eq("user_id", user.id).eq("status", "scheduled").
    gte("scheduled_at", now.toISOString()).lte("scheduled_at", in48h.toISOString()).
    order("scheduled_at", { ascending: true }).limit(1).
    then(({ data }) => {
      if (data && data.length > 0) {
        setHasUpcomingSoon(true);
        setUpcomingMentorName((data[0] as any).mentors?.name || null);
      }
    });

    // Check pending confirmation (past scheduled sessions)
    supabase.from("mentor_sessions").select("id").
    eq("user_id", user.id).eq("status", "scheduled").
    lt("scheduled_at", now.toISOString()).limit(1).
    then(({ data }) => {
      setHasPendingConfirmation(!!(data && data.length > 0));
    });

    // Last completed session
    supabase.from("mentor_sessions").select("completed_at").
    eq("user_id", user.id).eq("status", "completed").
    not("completed_at", "is", null).
    order("completed_at", { ascending: false }).limit(1).
    then(({ data }) => {
      if (data && data.length > 0 && data[0].completed_at) {
        const days = Math.floor((now.getTime() - new Date(data[0].completed_at).getTime()) / (1000 * 60 * 60 * 24));
        setLastSessionDaysAgo(days);
        setLastActivityDaysAgo(days);
      }
    });

    // Monthly comparison
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    Promise.all([
    supabase.from("mentor_sessions").select("id, duration").
    eq("user_id", user.id).eq("status", "completed").
    gte("completed_at", thisMonthStart),
    supabase.from("mentor_sessions").select("id, duration").
    eq("user_id", user.id).eq("status", "completed").
    gte("completed_at", lastMonthStart).lt("completed_at", thisMonthStart)]
    ).then(([thisMonth, lastMonth]) => {
      const thisCount = thisMonth.data?.length || 0;
      const lastCount = lastMonth.data?.length || 0;
      const thisHours = (thisMonth.data || []).reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
      const lastHours = (lastMonth.data || []).reduce((sum, s) => sum + (s.duration || 0), 0) / 60;
      setMonthlyComparison({
        mentorias: thisCount - lastCount,
        hours: Math.round((thisHours - lastHours) * 10) / 10
      });
    });
  }, [user, profile]);

  // Update contextual message when data changes
  useEffect(() => {
    if (!profile) return;
    setContextMsg(getContextualMessage(
      profile, stats, hasUpcomingSoon, upcomingMentorName,
      hasPendingConfirmation, lastSessionDaysAgo, lastActivityDaysAgo, isVolunteer
    ));
  }, [profile, stats, hasUpcomingSoon, upcomingMentorName, hasPendingConfirmation, lastSessionDaysAgo, lastActivityDaysAgo, isVolunteer]);

  useEffect(() => {
    if (!user) return;
    supabase.from("impact_history").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false }).
    then(({ data }) => {if (data) setImpactHistory(data);});
  }, [user]);

  const handleUpdateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setUpdating(true);
    const { error } = await supabase.from("profiles").update({ professional_status: updateData.professionalStatus as ProfessionalStatus }).eq("user_id", user.id);
    if (error) toast.error("Erro ao atualizar: " + error.message);else
    {
      toast.success("Atualizado! Que bom ver sua evolução 💪");
      await refreshProfile();
      const { data } = await supabase.from("impact_history").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false });
      if (data) setImpactHistory(data);
      setShowUpdateForm(false);
    }
    setUpdating(false);
  };

  const ComparisonIndicator = ({ value, suffix = "" }: {value: number;suffix?: string;}) => {
    if (value === 0) return <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Minus className="w-2.5 h-2.5" /> igual</span>;
    if (value > 0) return <span className="text-[10px] text-green-600 flex items-center gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> +{value}{suffix}</span>;
    return <span className="text-[10px] text-red-500 flex items-center gap-0.5"><TrendingDown className="w-2.5 h-2.5" /> {value}{suffix}</span>;
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
      </div>);

  }

  const showProfileCard = !isVolunteer && missingProfileItems.length > 0;

  return (
    <AppLayout>
      <motion.div
        initial="initial"
        animate="animate"
        variants={{ initial: {}, animate: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-4">

        {/* Welcome */}
        <motion.div
          variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
          className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30">

          <div className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.button onClick={() => setShowProfileEdit(true)} className="relative group" whileHover={{ scale: 1.05 }}>
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-hero flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                    {profile.photo_url ?
                    <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" /> :

                    <User className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                    }
                  </div>
                </motion.button>
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                    Olá, {profile.name.split(" ")[0]}! 👋
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {contextMsg}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isVolunteer &&
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full bg-muted/60 font-medium">
                    {professionalStatusLabels[profile.professional_status]}
                  </Badge>
                }
                {isVolunteer &&
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 rounded-full font-medium">
                    <Heart className="w-3 h-3 mr-1" /> Voluntário
                  </Badge>
                }
                {isAdmin &&
                <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs px-3 py-1 rounded-full font-medium">
                    <Shield className="w-3 h-3 mr-1" /> Admin
                  </Badge>
                }
              </div>
            </div>
          </div>
        </motion.div>

        {/* Complete Profile Card */}
        {showProfileCard &&
        <motion.div
          variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
          className="rounded-2xl border-2 border-yellow-400/60 bg-yellow-50 dark:bg-yellow-900/20 p-5">

            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-400/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">Complete seu Perfil</h3>
                <p className="text-xs text-yellow-700/80 dark:text-yellow-300/70 mt-0.5">Mentores conseguem te ajudar melhor com um perfil completo</p>
              </div>
            </div>
            <div className="space-y-1.5 mb-3 ml-12">
              {missingProfileItems.map((item) =>
            <div key={item} className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-300">
                  <div className="w-4 h-4 rounded border border-yellow-400/60 flex items-center justify-center">
                    {item === "Foto de perfil" && <Camera className="w-2.5 h-2.5" />}
                  </div>
                  {item}
                </div>
            )}
            </div>
            <Button
            size="sm"
            className="ml-12 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-yellow-950 text-xs font-medium"
            onClick={() => setShowProfileEdit(true)}>

              Completar perfil <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </motion.div>
        }

        {/* Quick Stats + Achievements Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Achievements Preview - Compact */}
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="col-span-2 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4">

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
            {recentUnlocked.length > 0 &&
            <div className="flex items-center gap-2 mt-2 flex-wrap">
                {recentUnlocked.slice(0, 3).map((ach) =>
              <span key={ach.id} className="text-sm" title={ach.name}>{ach.icon}</span>
              )}
              </div>
            }
            {nextAchievement &&
            <p className="text-xs text-muted-foreground mt-2">
                💡 Próxima: <strong className="text-foreground">{nextAchievement.name}</strong>
              </p>
            }
          </motion.div>

          {/* Quick Stats with monthly comparison */}
          {!isVolunteer &&
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 flex flex-col items-center justify-center text-center">

              <span className="text-2xl font-bold text-primary">{stats.totalMentorias}</span>
              <span className="text-xs text-muted-foreground">Mentorias</span>
              <ComparisonIndicator value={monthlyComparison.mentorias} suffix=" mês" />
            </motion.div>
          }
          {!isVolunteer &&
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 flex flex-col items-center justify-center text-center">

              <span className="text-2xl font-bold text-primary">{Math.round(stats.totalMinutes / 60 * 10) / 10}h</span>
              <span className="text-xs text-muted-foreground">Aprendizado</span>
              <ComparisonIndicator value={monthlyComparison.hours} suffix="h" />
            </motion.div>
          }
          {isVolunteer &&
          <>
              <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 flex flex-col items-center justify-center text-center">

                <span className="text-2xl font-bold text-primary">{stats.totalMentorias}</span>
                <span className="text-xs text-muted-foreground">Mentorias</span>
              </motion.div>
              <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 flex flex-col items-center justify-center text-center">

                <span className="text-2xl font-bold text-primary">{stats.uniqueContacts}</span>
                <span className="text-xs text-muted-foreground">Vidas impactadas</span>
              </motion.div>
            </>
          }
        </div>

        {/* Quick Links Row - Community + Communities + Mission side by side */}
        <div className={`grid gap-3 ${isVolunteer ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {/* Community */}
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 hover:border-green-500/30 transition-colors">

            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(142, 70%, 45%, 0.1)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-foreground text-sm">Comunidade Movê</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">Tire dúvidas e compartilhe experiências</p>
            <a href="https://chat.whatsapp.com/BFDDkhbwz5aFdg6WhIFU6C" target="_blank" rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 text-white py-2 rounded-xl font-medium text-xs transition-colors"
            style={{ backgroundColor: '#25D366' }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Entrar no grupo
            </a>
          </motion.div>

          {/* Referral card - only for mentees */}

          {/* Mentors Group - only for volunteers */}
          {isVolunteer &&
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 hover:border-purple-500/30 transition-colors">

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
          }

          {/* Minha Agenda - only for mentors */}
          {isMentor &&
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => navigate("/mentor/agenda")}>

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
          }

          {/* Communities Partner Card */}
          {!isVolunteer && !isPendingMentor &&
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
            className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-4 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => navigate("/comunidades")}>

              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Handshake className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Comunidades Parceiras</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">Vagas, networking e oportunidades</p>
              <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                Ver comunidades <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </motion.div>
          }

          {/* First Mission - compact, inline */}
          {!isVolunteer && !isPendingMentor &&
          <motion.div
            variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
          >
            <FirstMentorshipMission isCompleted={profile?.first_mentorship_booked || false} />
          </motion.div>
          }
        </div>

        {/* Tips Banner - compact for new users */}
        {!isVolunteer && stats.totalMentorias === 0 &&
        <motion.div
          variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
          className="rounded-xl border border-yellow-400/40 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 px-4 py-3 flex items-center gap-3">
            <Lightbulb className="w-4 h-4 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200 flex-1">Dicas para aproveitar o Movê</p>
            <Link to="/ajuda">
              <Button size="sm" variant="ghost" className="rounded-lg text-yellow-700 text-xs h-7 px-2">
                Ver guia <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </motion.div>
        }

        {/* Main Content */}
        <div className="space-y-4">
          {/* Trail & Dev Plan CTA Cards - compact for mentorados */}
          {!isVolunteer && !isPendingMentor &&
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <motion.div
                variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-4 group hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => navigate("/trilhas")}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">Trilhas</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Trilhas de conhecimento para impulsionar sua carreira!</p>
                <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explorar trilhas <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.div>

              <motion.div
                variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
                className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-2xl border border-secondary/20 p-4 group hover:border-secondary/40 transition-colors cursor-pointer"
                onClick={() => navigate("/plano")}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">Plano de Desenvolvimento</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Trace uma estratégia para sua carreira profissional!</p>
                <span className="text-xs font-medium text-secondary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Criar meu plano <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.div>
            </div>
          }

          {/* Interests Banner */}
          {!isVolunteer && !isPendingMentor &&
          <InterestsNotificationBanner onOpenInterestsEditor={() => setShowInterestsOnboarding(true)} />
          }

          {isPendingMentor && !isVolunteer && <PendingMentorBanner />}

          <VolunteerPanel />

          {/* MentorPanel removed - mentees access via /cadastro or menu */}

          {(!isVolunteer || isMentor) && <MentorshipSection />}

          {/* Evolution + Interests side-by-side on desktop */}
          {!isVolunteer && !isPendingMentor &&
          <div className="grid md:grid-cols-2 gap-4">
              <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5">

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Sua evolução</h3>
                </div>
                {showUpdateForm ?
              <form onSubmit={handleUpdateJourney} className="space-y-3">
                    <select
                  value={updateData.professionalStatus}
                  onChange={(e) => setUpdateData({ ...updateData, professionalStatus: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">

                      {professionalStatusOptions.map((opt) =>
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                  )}
                    </select>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowUpdateForm(false)} className="flex-1 rounded-xl">Cancelar</Button>
                      <Button type="submit" size="sm" disabled={updating} className="flex-1 rounded-xl bg-primary hover:bg-primary/90">
                        {updating && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />} Salvar
                      </Button>
                    </div>
                  </form> :

              <Button variant="ghost" size="sm" onClick={() => setShowUpdateForm(true)} className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" /> Atualizar status
                  </Button>
              }
              </motion.div>

              <motion.div
              variants={{ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5">

                <MenteeInterestsEditor />
              </motion.div>
            </div>
          }

          {!isVolunteer && <ReferralSection />}
        </div>
      </motion.div>

      {/* Modals */}
      <ProfileEditModal isOpen={showProfileEdit} onClose={() => setShowProfileEdit(false)} profile={profile} onProfileUpdated={refreshProfile} />
      {showOnboarding && <OnboardingTour onComplete={() => {setShowOnboarding(false);refreshProfile();}} />}
      <InterestsOnboardingModal open={showInterestsOnboarding} onClose={() => setShowInterestsOnboarding(false)} />
    </AppLayout>);

};

export default Home;