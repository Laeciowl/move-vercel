import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, User, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { useMentorCheck } from "@/hooks/useMentorCheck";
import AppLayout from "@/components/AppLayout";
import ProfileEditModal from "@/components/ProfileEditModal";
import InterestsOnboardingModal from "@/components/InterestsOnboardingModal";
import InterestsNotificationBanner from "@/components/InterestsNotificationBanner";
import PendingMentorBanner from "@/components/PendingMentorBanner";
import VolunteerPanel from "@/components/VolunteerPanel";
import NavigationGrid from "@/components/NavigationGrid";
import MenteeSessions from "@/components/MenteeSessions";
import ReferralSection from "@/components/ReferralSection";
import { usePendingMentorCheck } from "@/hooks/usePendingMentorCheck";

const Home = () => {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { isVolunteer } = useVolunteerCheck();
  const { isMentor } = useMentorCheck();
  const { isPendingMentor } = usePendingMentorCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showInterestsOnboarding, setShowInterestsOnboarding] = useState(false);

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

  const isMentorado = !isVolunteer && !isPendingMentor;

  const getGreetingMessage = () => {
    if (isVolunteer) return "Obrigado por transformar vidas ✨";
    return "Pronto para começar? Que tal agendar sua primeira mentoria?";
  };

  return (
    <AppLayout>
      <motion.div
        initial="initial"
        animate="animate"
        variants={{ initial: {}, animate: { transition: { staggerChildren: 0.06 } } }}
        className="space-y-8 pb-6 max-w-5xl mx-auto"
      >
        {/* Greeting */}
        <motion.div
          variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
          className="flex items-center gap-4 pt-4"
        >
          <motion.button
            onClick={() => setShowProfileEdit(true)}
            className="relative group shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-primary-foreground" />
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
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
              Olá, {profile.name.split(" ")[0]}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {getGreetingMessage()}
            </p>
          </div>
        </motion.div>

        {/* Banners */}
        {isPendingMentor && !isVolunteer && <PendingMentorBanner />}
        {isMentorado && (
          <InterestsNotificationBanner onOpenInterestsEditor={() => setShowInterestsOnboarding(true)} />
        )}

        {/* Volunteer Panel */}
        <VolunteerPanel />

        {/* Navigation Grid */}
        <motion.div variants={{ initial: { opacity: 0 }, animate: { opacity: 1 } }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Menu de navegação</h2>
          <NavigationGrid isVolunteer={isVolunteer} isMentor={isMentor} />
        </motion.div>

        {/* Mentee-only sections */}
        {isMentorado && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left column - Mentorias (3/5) */}
            <motion.div
              variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
              className="lg:col-span-3"
            >
              <MenteeSessions />
            </motion.div>

            {/* Right column - Referral (2/5) */}
            <div className="lg:col-span-2 space-y-6">
              <ReferralSection />
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <ProfileEditModal isOpen={showProfileEdit} onClose={() => setShowProfileEdit(false)} profile={profile} onProfileUpdated={refreshProfile} />
      <InterestsOnboardingModal open={showInterestsOnboarding} onClose={() => setShowInterestsOnboarding(false)} />
    </AppLayout>
  );
};

export default Home;
