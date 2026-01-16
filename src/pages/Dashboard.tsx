import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LogOut, FileText, Video, RefreshCw, User, 
  Loader2, BookOpen, History, ExternalLink, Filter, Edit, Shield, Heart, Play
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Enums } from "@/integrations/supabase/types";

type ProfessionalStatus = Enums<"professional_status">;

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  item_type: string;
  category: string;
  created_at: string;
}

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

const categoryOptions = [
  { value: "all", label: "Todos" },
  { value: "curriculo", label: "Currículo" },
  { value: "marketing", label: "Marketing Pessoal" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "soft_skills", label: "Soft Skills" },
  { value: "geral", label: "Geral" },
];

const Dashboard = () => {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { isVolunteer } = useVolunteerCheck();
  const navigate = useNavigate();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [impactHistory, setImpactHistory] = useState<ImpactHistory[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [updateData, setUpdateData] = useState({
    professionalStatus: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

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

      const { data: contentData } = await supabase
        .from("content_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (contentData) {
        setContents(contentData as ContentItem[]);
      }

      const { data: historyData } = await supabase
        .from("impact_history")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false });

      if (historyData) {
        setImpactHistory(historyData as ImpactHistory[]);
      }

      setLoadingContent(false);
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
      toast.success("Status atualizado com sucesso!");
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredContents = selectedCategory === "all" 
    ? contents 
    : contents.filter((c) => c.category === selectedCategory);
  
  const videos = filteredContents.filter((c) => c.item_type === "video");
  const pdfs = filteredContents.filter((c) => c.item_type === "pdf");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gradient">Movê</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-primary"
              >
                <Shield className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/5 via-card to-accent/10 rounded-2xl border border-border/50 p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfileEdit(true)}
                className="relative group"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors">
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="w-3 h-3 text-primary-foreground" />
                </div>
              </button>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  E aí, {profile.name.split(" ")[0]}! 🚀
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isVolunteer ? "Obrigado por ajudar a transformar vidas" : "Bora crescer juntos!"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {!isVolunteer && (
                <Badge variant="secondary" className="text-xs">
                  {professionalStatusLabels[profile.professional_status]}
                </Badge>
              )}
              {isVolunteer && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  <Heart className="w-3 h-3 mr-1" />
                  Voluntário
                </Badge>
              )}
              {isAdmin && (
                <Badge className="bg-amber-500 text-white text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Volunteer Panel */}
            <VolunteerPanel />

            {/* Mentor Panel - only for non-volunteers */}
            {!isVolunteer && <MentorPanel />}

            {/* Mentorship Section - only for non-volunteers */}
            {!isVolunteer && <MentorshipSection />}

            {/* Content Library */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground">O que oferecemos</h3>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Videos */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  Aulas e Lives
                </h4>
                
                {loadingContent ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : videos.length > 0 ? (
                  <div className="grid gap-4">
                    {videos.map((video) => (
                      <div key={video.id} className="bg-card rounded-xl border border-border overflow-hidden group">
                        <div className="aspect-video relative">
                          <iframe
                            src={getYouTubeEmbedUrl(video.url)}
                            title={video.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="p-4">
                          <h5 className="font-semibold text-foreground">{video.title}</h5>
                          {video.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{video.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl p-6 text-center">
                    <Play className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Em breve teremos aulas incríveis para você!</p>
                  </div>
                )}
              </div>

              {/* PDFs / Templates */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Guias e Templates
                </h4>
                
                {loadingContent ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : pdfs.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {pdfs.map((pdf) => (
                      <a
                        key={pdf.id}
                        href={pdf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 hover:shadow-md transition-all group flex items-start gap-3"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                            {pdf.title}
                          </h5>
                          {pdf.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pdf.description}</p>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-xl p-6 text-center">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Templates e guias em breve!</p>
                  </div>
                )}
              </div>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Evolution - Only for students */}
            {!isVolunteer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border border-border p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Sua evolução</h3>
                </div>

                {showUpdateForm ? (
                  <form onSubmit={handleUpdateJourney} className="space-y-3">
                    <select
                      value={updateData.professionalStatus}
                      onChange={(e) => setUpdateData({ ...updateData, professionalStatus: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {professionalStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowUpdateForm(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={updating} className="flex-1">
                        {updating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        Salvar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setShowUpdateForm(true)} className="w-full">
                    Atualizar status
                  </Button>
                )}
              </motion.div>
            )}

            {/* Impact History - Only for students */}
            {!isVolunteer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl border border-border p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Sua trajetória</h3>
                </div>

                {impactHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {impactHistory.map((entry) => (
                      <div key={entry.id} className="border-l-2 border-primary/30 pl-3 py-1">
                        <p className="text-sm font-medium text-foreground">
                          {professionalStatusLabels[entry.professional_status]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.recorded_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Atualize seu status e acompanhe sua evolução! 💪
                  </p>
                )}
              </motion.div>
            )}

            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-5"
            >
              <h3 className="font-bold text-foreground mb-2">Quem somos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-primary">Movê</span> é uma iniciativa social que conecta jovens a mentores e recursos para impulsionar suas carreiras. Acreditamos no poder da educação e da comunidade.
              </p>
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">
                  Projeto fundado por{" "}
                  <a 
                    href="https://www.linkedin.com/in/laecio-rodrigues" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Laecio Oliveira
                  </a>
                </p>
                <a 
                  href="/termos" 
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Termos de Uso e Privacidade
                </a>
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
