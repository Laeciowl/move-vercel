import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LogOut, RefreshCw, User, 
  Loader2, History, Edit, Shield, Heart, Sparkles, ExternalLink, MessageCircle, Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useVolunteerCheck } from "@/hooks/useVolunteerCheck";
import MentorshipSection from "@/components/MentorshipSection";
import NotificationBell from "@/components/NotificationBell";
import ProfileEditModal from "@/components/ProfileEditModal";
import MentorPanel from "@/components/MentorPanel";
import VolunteerPanel from "@/components/VolunteerPanel";
import BugReportButton from "@/components/BugReportButton";
import ContentLibrary from "@/components/ContentLibrary";
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
  const navigate = useNavigate();
  const location = useLocation();
  const [impactHistory, setImpactHistory] = useState<ImpactHistory[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
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
    }
  }, [profile]);

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
      {/* Background decorative elements - matching hero style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Curved movement paths */}
        <svg className="absolute w-full h-full opacity-30" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="xMidYMid slice">
          <motion.path
            d="M-100 400 Q 300 200 600 400 T 1300 400"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeOpacity="0.1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: 0.5 }}
          />
          <motion.path
            d="M-100 500 Q 400 300 700 500 T 1400 450"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeOpacity="0.08"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3.5, delay: 0.8 }}
          />
        </svg>

        {/* Floating dots */}
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-primary/20"
        />
        <motion.div
          animate={{ x: [0, -60, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-primary/15"
        />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/3 w-4 h-4 rounded-full bg-primary/10"
        />

        {/* Gradient accent */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-accent/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent/20 via-transparent to-transparent" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.h1 
            className="text-2xl md:text-3xl font-extrabold text-gradient cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate("/")}
          >
            Movê
          </motion.h1>
          <div className="flex items-center gap-2 md:gap-3">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-primary hover:bg-primary/10"
              >
                <Shield className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Admin</span>
              </Button>
            )}
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileEdit(true)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Settings className="w-4 h-4 md:mr-1.5" />
              <span className="hidden md:inline">Perfil</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <LogOut className="w-4 h-4 md:mr-1.5" />
              <span className="hidden md:inline">Sair</span>
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Welcome Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-accent/20 border border-border/50 shadow-card"
        >
          {/* Decorative elements inside card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-2xl" />
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 md:gap-5">
                <motion.button
                  onClick={() => setShowProfileEdit(true)}
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-hero flex items-center justify-center overflow-hidden shadow-button group-hover:shadow-lg transition-shadow">
                    {profile.photo_url ? (
                      <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
                    )}
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-card rounded-full flex items-center justify-center shadow-md border border-border"
                  >
                    <Edit className="w-3.5 h-3.5 text-primary" />
                  </motion.div>
                </motion.button>
                <div>
                  <motion.h2 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl md:text-3xl font-bold text-foreground"
                  >
                    E aí, {profile.name.split(" ")[0]}! 
                    <motion.span
                      animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                      transition={{ duration: 2, delay: 0.5 }}
                      className="inline-block ml-2"
                    >
                      🚀
                    </motion.span>
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-muted-foreground mt-1 flex items-center gap-2"
                  >
                    {isVolunteer ? (
                      <>
                        <Sparkles className="w-4 h-4 text-primary" />
                        Obrigado por ajudar a transformar vidas
                      </>
                    ) : (
                      "Bora crescer juntos!"
                    )}
                  </motion.p>
                </div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2"
              >
                {!isVolunteer && (
                  <Badge variant="secondary" className="text-sm px-4 py-1.5 rounded-full bg-muted/80 backdrop-blur-sm">
                    {professionalStatusLabels[profile.professional_status]}
                  </Badge>
                )}
                {isVolunteer && (
                  <Badge className="bg-gradient-hero text-primary-foreground text-sm px-4 py-1.5 rounded-full shadow-soft">
                    <Heart className="w-3.5 h-3.5 mr-1.5" />
                    Voluntário
                  </Badge>
                )}
                {isAdmin && (
                  <Badge className="bg-secondary text-secondary-foreground text-sm px-4 py-1.5 rounded-full">
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    Admin
                  </Badge>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Volunteer Panel */}
            <VolunteerPanel />

            {/* Mentor Panel - only for non-volunteers */}
            {!isVolunteer && <MentorPanel />}

            {/* Mentorship Section - only for non-volunteers */}
            {!isVolunteer && <MentorshipSection />}

            {/* Content Library */}
            <ContentLibrary />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Evolution - Only for students */}
            {!isVolunteer && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl border border-border/50 p-6 shadow-card"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">Sua evolução</h3>
                </div>

                {showUpdateForm ? (
                  <form onSubmit={handleUpdateJourney} className="space-y-4">
                    <select
                      value={updateData.professionalStatus}
                      onChange={(e) => setUpdateData({ ...updateData, professionalStatus: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                      {professionalStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setShowUpdateForm(false)} className="flex-1 rounded-xl">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={updating} className="flex-1 rounded-xl bg-gradient-hero hover:opacity-90">
                        {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Salvar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowUpdateForm(true)} 
                    className="w-full rounded-xl hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar status
                  </Button>
                )}
              </motion.div>
            )}

            {/* Impact History - Only for students */}
            {!isVolunteer && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl border border-border/50 p-6 shadow-card"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">Sua trajetória</h3>
                </div>

                {impactHistory.length > 0 ? (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                    {impactHistory.map((entry, i) => (
                      <motion.div 
                        key={entry.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="border-l-3 border-primary/40 pl-4 py-2 bg-gradient-to-r from-muted/30 to-transparent rounded-r-lg"
                      >
                        <p className="font-semibold text-foreground">
                          {professionalStatusLabels[entry.professional_status]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.recorded_at).toLocaleDateString("pt-BR")}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">
                      Atualize seu status e acompanhe sua evolução! 💪
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* WhatsApp Community Card - Everyone */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-card to-green-600/10 rounded-2xl border border-green-500/20 p-6 shadow-card group hover:shadow-lg transition-shadow"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors" />
              
              <div className="relative">
                <h3 className="font-bold text-foreground text-lg mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  Comunidade Movê
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  Entre no nosso grupo do WhatsApp para conectar com outros membros, tirar dúvidas e ficar por dentro das novidades!
                </p>
                <a 
                  href="https://chat.whatsapp.com/BFDDkhbwz5aFdg6WhIFU6C"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Entrar na comunidade
                </a>
              </div>
            </motion.div>

            {/* WhatsApp Mentors Card - Only for Volunteers/Mentors */}
            {isVolunteer && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-card to-purple-600/10 rounded-2xl border border-purple-500/20 p-6 shadow-card group hover:shadow-lg transition-shadow"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                
                <div className="relative">
                  <h3 className="font-bold text-foreground text-lg mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-600" />
                    Grupo dos Mentores
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    Grupo exclusivo para mentores! Compartilhe experiências, tire dúvidas e conecte-se com outros voluntários.
                  </p>
                  <a 
                    href="https://chat.whatsapp.com/LKpz2hr7FnZDpCgNXdxwHl"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-purple-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Entrar no grupo
                  </a>
                </div>
              </motion.div>
            )}

            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: isVolunteer ? 0.55 : 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/20 rounded-2xl border border-primary/20 p-6 shadow-card"
            >
              {/* Decorative blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              
              <div className="relative">
                <h3 className="font-bold text-foreground text-lg mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Quem somos
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-bold text-gradient">Movê</span> é uma iniciativa social que conecta jovens a mentores e recursos para impulsionar suas carreiras. Acreditamos no poder da educação e da comunidade.
                </p>
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Projeto fundado por{" "}
                    <a 
                      href="https://www.linkedin.com/in/laecio-rodrigues" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold"
                    >
                      Laecio Oliveira
                    </a>
                  </p>
                  <a 
                    href="/termos" 
                    className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    Termos de Uso e Privacidade
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Bug Report Button */}
      <BugReportButton />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        profile={profile}
        onProfileUpdated={refreshProfile}
      />
    </div>
  );
};

export default Dashboard;
