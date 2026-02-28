import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LogOut, RefreshCw, User, 
  Loader2, History, Edit, Shield, Heart, Sparkles, ExternalLink, MessageCircle, Settings, Briefcase, Target, ChevronRight
} from "lucide-react";
import logoMove from "@/assets/logo-move.png";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { useMentorCheck } from "@/hooks/useMentorCheck";
import { usePendingMentorCheck } from "@/hooks/usePendingMentorCheck";
import MentorshipSection from "@/components/MentorshipSection";
import NotificationBell from "@/components/NotificationBell";
import ProfileEditModal from "@/components/ProfileEditModal";
import MentorPanel from "@/components/MentorPanel";
import VolunteerPanel from "@/components/VolunteerPanel";
import BugReportButton from "@/components/BugReportButton";
import ContentLibrary from "@/components/ContentLibrary";
import TrailsDashboardCard from "@/components/TrailsDashboardCard";
import NpsModal from "@/components/NpsModal";
import OnboardingTour from "@/components/OnboardingTour";

import PlatformGuide from "@/components/PlatformGuide";
import PendingMentorBanner from "@/components/PendingMentorBanner";
import MenteeInterestsEditor from "@/components/MenteeInterestsEditor";
import InterestsOnboardingModal from "@/components/InterestsOnboardingModal";
import InterestsNotificationBanner from "@/components/InterestsNotificationBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Enums } from "@/integrations/supabase/types";

type ProfessionalStatus = Enums<"professional_status">;

interface ImpactHistory {
  id: string;
  professional_status: string;
  income_range: string;
  recorded_at: string;
}

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

const Dashboard = () => {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { isVolunteer } = useVolunteerCheck();
  const { isMentor } = useMentorCheck();
  const { isPendingMentor } = usePendingMentorCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const [impactHistory, setImpactHistory] = useState<ImpactHistory[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInterestsOnboarding, setShowInterestsOnboarding] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateData, setUpdateData] = useState({
    professionalStatus: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Permite redirecionar para abrir o modal de perfil (ex: /dashboard?editarPerfil=1)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("editarPerfil") === "1") {
      setShowProfileEdit(true);
      params.delete("editarPerfil");
      const nextSearch = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (profile) {
      setUpdateData({
        professionalStatus: profile.professional_status,
      });
      
      // Show onboarding for new users who haven't completed it
      // Only show for non-volunteers (mentorados)
      if (!profile.onboarding_completed && !isVolunteer) {
        setShowOnboarding(true);
      }
    }
  }, [profile, isVolunteer]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: historyData } = await supabase
        .from("impact_history")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false });

      if (historyData) {
        setImpactHistory(historyData as ImpactHistory[]);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUpdateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setUpdating(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        professional_status: updateData.professionalStatus as ProfessionalStatus,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success("Atualizado! Que bom ver sua evolução 💪");
      await refreshProfile();
      
      const { data: historyData } = await supabase
        .from("impact_history")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false });

      if (historyData) {
        setImpactHistory(historyData as ImpactHistory[]);
      }
      
      setShowUpdateForm(false);
    }

    setUpdating(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center shadow-button">
            <Loader2 className="w-8 h-8 animate-spin text-primary-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Minimal digital background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Subtle mesh gradient */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        
        {/* Grid overlay for digital feel */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Subtle floating orbs */}
        <motion.div
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[20%] w-64 h-64 rounded-full bg-primary/5 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-40 left-[10%] w-80 h-80 rounded-full bg-secondary/5 blur-3xl"
        />
      </div>


      {/* Header - Minimal & Clean */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-30 bg-background/60 backdrop-blur-2xl border-b border-border/30"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <motion.div 
            className="cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
          >
            <img src={logoMove} alt="Movê" className="h-8 w-auto" />
          </motion.div>
          <div className="flex items-center gap-1 md:gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-primary hover:bg-primary/10 rounded-full px-3"
              >
                <Shield className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline text-sm">Admin</span>
              </Button>
            )}
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileEdit(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-3"
            >
              <Settings className="w-4 h-4 md:mr-1.5" />
              <span className="hidden md:inline text-sm">Perfil</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-3"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <motion.main 
        className="container mx-auto px-4 py-6 md:py-8 space-y-6 relative z-10"
        initial="initial"
        animate="animate"
        variants={{
          initial: {},
          animate: {
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.1
            }
          }
        }}
      >
        {/* Welcome Card - Simplified */}
        <motion.div
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30"
        >
          <div className="p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => setShowProfileEdit(true)}
                  className="relative group"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-hero flex items-center justify-center overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                    {profile.photo_url ? (
                      <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                    )}
                  </div>
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-card rounded-full flex items-center justify-center shadow-sm border border-border/50"
                  >
                    <Edit className="w-3 h-3 text-primary" />
                  </motion.div>
                </motion.button>
                <div>
                  <motion.h2 
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-xl md:text-2xl font-semibold text-foreground"
                  >
                    Olá, {profile.name.split(" ")[0]}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="text-sm text-muted-foreground mt-0.5"
                  >
                    {isVolunteer ? (
                      <span className="flex items-center gap-1.5">
                        <motion.span
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        </motion.span>
                        Obrigado por transformar vidas
                      </span>
                    ) : (
                      "Bora crescer juntos!"
                    )}
                  </motion.p>
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-wrap gap-2"
              >
                {!isVolunteer && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge className="text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold cursor-default">
                      {professionalStatusLabels[profile.professional_status]}
                    </Badge>
                  </motion.div>
                )}
                {isVolunteer && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 rounded-full font-medium cursor-default">
                      <Heart className="w-3 h-3 mr-1" />
                      Voluntário
                    </Badge>
                  </motion.div>
                )}
                {isAdmin && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs px-3 py-1 rounded-full font-medium cursor-default">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <motion.div 
          variants={{
            initial: { opacity: 0 },
            animate: { opacity: 1 }
          }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interests Notification Banner - For non-volunteers who haven't set interests */}
            {!isVolunteer && !isPendingMentor && (
              <InterestsNotificationBanner 
                onOpenInterestsEditor={() => setShowInterestsOnboarding(true)} 
              />
            )}


            {/* Pending Mentor Banner - Show for users who applied as mentors but aren't approved yet */}
            {isPendingMentor && !isVolunteer && <PendingMentorBanner />}

            {/* Volunteer Panel */}
            <VolunteerPanel />

            {/* Mentor Panel - only for non-volunteers who are also not mentors and not pending mentors */}
            {!isVolunteer && !isMentor && !isPendingMentor && <MentorPanel />}

            {/* Mentorship Section - for non-volunteers OR approved mentors (so mentors can also book sessions) */}
            {(!isVolunteer || isMentor) && <MentorshipSection />}

            {/* Trails Dashboard Card - for mentorados (including admins who are also mentorados) */}
            {(!isVolunteer || isAdmin) && <TrailsDashboardCard />}

            {/* Dev Plan Card */}
            {(!isVolunteer || isAdmin) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 group hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate("/plano")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Plano de Desenvolvimento</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Monte seu roteiro personalizado de crescimento profissional.</p>
                <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Acessar plano <ChevronRight className="w-4 h-4" />
                </span>
              </motion.div>
            )}

            {/* Content Library */}
            <ContentLibrary />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
          {/* Evolution - Only for students (not for pending mentors either) */}
            {!isVolunteer && !isPendingMentor && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
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
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    >
                      {professionalStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowUpdateForm(false)} className="flex-1 rounded-xl">
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={updating} className="flex-1 rounded-xl bg-primary hover:bg-primary/90">
                        {updating && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                        Salvar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowUpdateForm(true)} 
                    className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar status
                  </Button>
                )}
              </motion.div>
            )}

            {/* Mentee Interests - Only for non-volunteers */}
            {!isVolunteer && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.22 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
              >
                <MenteeInterestsEditor />
              </motion.div>
            )}

            {/* Impact History - Only for students */}
            {!isVolunteer && impactHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <History className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Sua trajetória</h3>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {impactHistory.slice(0, 5).map((entry, i) => (
                    <motion.div 
                      key={entry.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {professionalStatusLabels[entry.professional_status]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.recorded_at).toLocaleDateString("pt-BR")}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* WhatsApp Community Card */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 group hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground">Comunidade</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Entre no nosso grupo do WhatsApp e conecte-se com outros membros!
              </p>
              <a 
                href="https://chat.whatsapp.com/BFDDkhbwz5aFdg6WhIFU6C"
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Entrar no grupo
              </a>
            </motion.div>

            {/* TEM VAGA? WhatsApp Community Card - Only for non-volunteers and non-pending mentors */}
            {!isVolunteer && !isPendingMentor && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 group hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">TEM VAGA?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Comunidade com vagas de estágio até analista para jovens talentos! 🚀
                </p>
                <a 
                  href="https://chat.whatsapp.com/JugF130879CH7Lgo2Ycs1b"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Entrar no grupo
                </a>
              </motion.div>
            )}

            {/* WhatsApp Mentors Card - Only for Volunteers */}
            {isVolunteer && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 group hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-600" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">Mentores</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Grupo exclusivo para mentores compartilharem experiências.
                </p>
                <a 
                  href="https://chat.whatsapp.com/LKpz2hr7FnZDpCgNXdxwHl"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-xl font-medium text-sm hover:bg-purple-700 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Entrar no grupo
                </a>
              </motion.div>
            )}

            {/* Platform Guide - Above About Section */}
            <PlatformGuide userType={isVolunteer ? "mentor" : "mentee"} />

            {/* About Section - Compact */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: isVolunteer ? 0.45 : 0.4 }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Sobre o Movê</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Hub de orientação profissional: mentorias, conteúdos e conexões para impulsionar carreiras.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <a 
                  href="https://www.linkedin.com/in/laecio-rodrigues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @laecio-rodrigues
                </a>
                <span className="text-muted-foreground">•</span>
                <a 
                  href="/termos" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Termos
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.main>

      {/* Bug Report Button */}
      <BugReportButton />

      {/* NPS - now rendered as inline banner at top via AppLayout, not here */}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        profile={profile}
        onProfileUpdated={refreshProfile}
      />

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour 
          onComplete={() => {
            setShowOnboarding(false);
            refreshProfile();
          }} 
        />
      )}

      {/* Interests Onboarding Modal */}
      <InterestsOnboardingModal
        open={showInterestsOnboarding}
        onClose={() => setShowInterestsOnboarding(false)}
      />
    </div>
  );
};

export default Dashboard;
