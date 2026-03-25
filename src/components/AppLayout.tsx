import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Users, Trophy, BookOpen, HelpCircle, User, Shield, LogOut,
  Calendar, Menu, X, Bell, Settings, MessageCircle, ChevronRight, Target, Briefcase, Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import { useMentorCheck } from "@/hooks/useMentorCheck";
import NotificationBell from "@/components/NotificationBell";
import BugReportButton from "@/components/BugReportButton";
import NpsModal from "@/components/NpsModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoMove from "@/assets/logo-move.png";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, loading: authLoading, refreshProfile } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { isVolunteer, loading: volunteerLoading } = useVolunteerCheck();
  const { isMentor, loading: mentorLoading } = useMentorCheck();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [needsQuiz, setNeedsQuiz] = useState<boolean | null>(null);

  const rolesLoading = adminLoading || volunteerLoading || mentorLoading;

  // Check if mentee needs onboarding quiz
  useEffect(() => {
    if (rolesLoading || !profile) {
      setNeedsQuiz(null);
      return;
    }
    const quizPassed = (profile as any).onboarding_quiz_passed;
    if (!quizPassed && !isAdmin && !isVolunteer && !isMentor && !profile.first_mentorship_booked) {
      setNeedsQuiz(true);
    } else {
      setNeedsQuiz(false);
    }
  }, [profile, rolesLoading, isAdmin, isVolunteer, isMentor]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Role-based navigation items - stable while loading
  const getNavItems = () => {
    if (rolesLoading) {
      // Show minimal nav while roles are loading to prevent flicker
      return [
        { path: "/inicio", label: "Início", icon: Home },
        { path: "/conquistas", label: "Conquistas", icon: Trophy },
        { path: "/ajuda", label: "Ajuda", icon: HelpCircle },
      ];
    }

    if (isAdmin) {
      return [
        { path: "/inicio", label: "Dashboard", icon: Home },
        { path: "/admin", label: "Admin", icon: Shield },
        { path: "/mentores", label: "Mentores", icon: Users },
        { path: "/trilhas", label: "Trilhas", icon: Target },
        { path: "/plano", label: "Plano", icon: Briefcase },
        { path: "/conquistas", label: "Conquistas", icon: Trophy },
        { path: "/conteudos", label: "Conteúdos", icon: BookOpen },
        { path: "/ajuda", label: "Ajuda", icon: HelpCircle },
      ];
    }

    if (isVolunteer || isMentor) {
      return [
        { path: "/inicio", label: "Início", icon: Home },
        { path: "/mentor/agenda", label: "Agenda", icon: Calendar },
        { path: "/conquistas", label: "Conquistas", icon: Trophy },
        { path: "/conteudos", label: "Conteúdos", icon: BookOpen },
        { path: "/ajuda", label: "Ajuda", icon: HelpCircle },
      ];
    }

    // Mentorado
    return [
      { path: "/inicio", label: "Início", icon: Home },
      { path: "/mentores", label: "Mentores", icon: Users },
      { path: "/trilhas", label: "Trilhas", icon: Target },
      { path: "/plano", label: "Plano", icon: Briefcase },
      { path: "/conquistas", label: "Conquistas", icon: Trophy },
      { path: "/conteudos", label: "Conteúdos", icon: BookOpen },
      { path: "/ajuda", label: "Ajuda", icon: HelpCircle },
    ];
  };

  const navItems = getNavItems();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 bg-background/60 backdrop-blur-2xl border-b border-border/30"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              className="cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/inicio")}
            >
              <img src={logoMove} alt="Movê" className="h-8 w-auto" />
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/avaliar")}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full px-3 hidden md:flex gap-1.5"
            >
              <Star className="w-4 h-4" />
              <span className="text-sm">Avalie-nos</span>
            </Button>
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/inicio?editarPerfil=1")}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-3 hidden md:flex"
            >
              <Settings className="w-4 h-4 md:mr-1.5" />
              <span className="hidden lg:inline text-sm">Perfil</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full px-3 hidden md:flex"
            >
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-full"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-30 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-72 bg-card border-l border-border z-40 md:hidden"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/30">
                  <span className="font-semibold text-foreground">Menu</span>
                  <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* User info */}
                {profile && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center overflow-hidden">
                      {profile.photo_url ? (
                        <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{profile.name.split(" ")[0]}</p>
                      <p className="text-xs text-muted-foreground">
                        {isVolunteer ? "Voluntário" : "Mentorado"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Nav links */}
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                        {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </Link>
                    );
                  })}
                </nav>

                <div className="pt-3 border-t border-border/30 space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/avaliar");
                    }}
                    className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Avalie-nos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { navigate("/inicio?editarPerfil=1"); setMobileMenuOpen(false); }}
                    className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Perfil
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start text-muted-foreground hover:text-destructive rounded-xl"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-xl border-t border-border/30 md:hidden">
        <nav className="flex items-center justify-around py-2 px-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-6 relative z-10 pb-24 md:pb-6">
        {children}
      </main>

      <BugReportButton />
    </div>
  );
};

export default AppLayout;
