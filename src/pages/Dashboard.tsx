import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LogOut, FileText, Video, RefreshCw, User, 
  Loader2, BookOpen, History, ExternalLink, Filter
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MentorshipSection from "@/components/MentorshipSection";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";

type ProfessionalStatus = Enums<"professional_status">;
type IncomeRange = Enums<"income_range">;

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

const incomeRangeLabels: Record<string, string> = {
  sem_renda: "Sem renda",
  ate_1500: "Até R$ 1.500",
  "1500_3000": "R$ 1.500 – R$ 3.000",
  acima_3000: "Acima de R$ 3.000",
};

const professionalStatusOptions = [
  { value: "desempregado", label: "Desempregado" },
  { value: "estudante", label: "Estudante" },
  { value: "estagiario", label: "Estagiário" },
  { value: "empregado", label: "Empregado" },
  { value: "freelancer_pj", label: "Freelancer / PJ" },
];

const incomeRangeOptions = [
  { value: "sem_renda", label: "Sem renda" },
  { value: "ate_1500", label: "Até R$ 1.500" },
  { value: "1500_3000", label: "R$ 1.500 – R$ 3.000" },
  { value: "acima_3000", label: "Acima de R$ 3.000" },
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
  const navigate = useNavigate();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [impactHistory, setImpactHistory] = useState<ImpactHistory[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [updateData, setUpdateData] = useState({
    professionalStatus: "",
    incomeRange: "",
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
        incomeRange: profile.income_range,
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch content items
      const { data: contentData } = await supabase
        .from("content_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (contentData) {
        setContents(contentData as ContentItem[]);
      }

      // Fetch impact history
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
        income_range: updateData.incomeRange as IncomeRange,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success("Jornada atualizada com sucesso!");
      await refreshProfile();
      
      // Refresh impact history
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
    <div className="min-h-screen bg-gradient-warm">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gradient">Movê</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{profile.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-8 mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Olá, {profile.name.split(" ")[0]}! 👋
          </h2>
          <p className="text-muted-foreground">
            Bem-vindo(a) ao Movê. Aqui você encontra conteúdos para impulsionar sua jornada profissional.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">
              {professionalStatusLabels[profile.professional_status]}
            </span>
            <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
              {incomeRangeLabels[profile.income_range]}
            </span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Content Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Mentorship Section */}
            <MentorshipSection />

            {/* Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card rounded-2xl shadow-card p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Filtrar por área</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Videos */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Vídeos</h3>
              </div>
              
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : videos.length > 0 ? (
                <div className="grid gap-4">
                  {videos.map((video) => (
                    <div key={video.id} className="bg-card rounded-2xl shadow-card overflow-hidden">
                      <div className="aspect-video">
                        <iframe
                          src={getYouTubeEmbedUrl(video.url)}
                          title={video.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-foreground">{video.title}</h4>
                        {video.description && (
                          <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl shadow-card p-8 text-center">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum vídeo disponível ainda.</p>
                  <p className="text-sm text-muted-foreground mt-1">Em breve teremos conteúdos incríveis para você!</p>
                </div>
              )}
            </motion.section>

            {/* PDFs */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Materiais</h3>
              </div>
              
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : pdfs.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {pdfs.map((pdf) => (
                    <a
                      key={pdf.id}
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-card rounded-2xl shadow-card p-5 hover:shadow-lg transition-shadow group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0">
                          <BookOpen className="w-6 h-6 text-accent-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {pdf.title}
                          </h4>
                          {pdf.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {pdf.description}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="bg-card rounded-2xl shadow-card p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum material disponível ainda.</p>
                  <p className="text-sm text-muted-foreground mt-1">Em breve teremos PDFs e guias para você!</p>
                </div>
              )}
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Update Journey */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl shadow-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Atualize sua jornada</h3>
              </div>

              {showUpdateForm ? (
                <form onSubmit={handleUpdateJourney} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Situação profissional
                    </label>
                    <select
                      value={updateData.professionalStatus}
                      onChange={(e) => setUpdateData({ ...updateData, professionalStatus: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {professionalStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Faixa de renda
                    </label>
                    <select
                      value={updateData.incomeRange}
                      onChange={(e) => setUpdateData({ ...updateData, incomeRange: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {incomeRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUpdateForm(false)}
                      className="flex-1 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 bg-gradient-hero text-primary-foreground py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Salvar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowUpdateForm(true)}
                  className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Atualizar status
                </button>
              )}
            </motion.section>

            {/* Impact History */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl shadow-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Histórico</h3>
              </div>

              {impactHistory.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {impactHistory.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-primary/30 pl-3 py-1">
                      <p className="text-sm font-medium text-foreground">
                        {professionalStatusLabels[entry.professional_status]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {incomeRangeLabels[entry.income_range]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.recorded_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Seu histórico aparecerá aqui conforme você atualizar sua jornada.
                </p>
              )}
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
