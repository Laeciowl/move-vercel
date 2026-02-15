import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Loader2, Megaphone, Briefcase, Globe, BookOpen, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type CommunityCategory = "vagas" | "networking" | "conteudo" | "outros";

interface Community {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  category: CommunityCategory;
  external_link: string;
  active: boolean;
  sort_order: number;
}

const categoryConfig: Record<CommunityCategory, { label: string; icon: React.ReactNode; colorClass: string; btnClass: string }> = {
  vagas: {
    label: "💼 Vagas e Oportunidades",
    icon: <Briefcase className="w-5 h-5" />,
    colorClass: "text-blue-600",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  networking: {
    label: "🌐 Networking e Conexões",
    icon: <Globe className="w-5 h-5" />,
    colorClass: "text-emerald-600",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  conteudo: {
    label: "📚 Conteúdo e Aprendizado",
    icon: <BookOpen className="w-5 h-5" />,
    colorClass: "text-primary",
    btnClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
  outros: {
    label: "✨ Outras Comunidades",
    icon: <Sparkles className="w-5 h-5" />,
    colorClass: "text-purple-600",
    btnClass: "bg-purple-600 hover:bg-purple-700 text-white",
  },
};

const Communities = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data } = await supabase
        .from("partner_communities")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      setCommunities((data as Community[]) || []);
      setLoading(false);
    };
    fetchCommunities();
  }, []);

  const grouped = communities.reduce<Record<CommunityCategory, Community[]>>((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<CommunityCategory, Community[]>);

  const categoryOrder: CommunityCategory[] = ["vagas", "networking", "conteudo", "outros"];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/inicio")} className="mb-4 gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">🤝 Comunidades Parceiras</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Conecte-se com comunidades que apoiam seu desenvolvimento profissional
          </p>
        </motion.div>

        {communities.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-card/50 rounded-2xl border border-border/30">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">📢 Em breve!</h2>
            <p className="text-muted-foreground">Estamos firmando parcerias com comunidades incríveis. Volte em breve!</p>
          </motion.div>
        ) : (
          <div className="space-y-10">
            {categoryOrder.map(cat => {
              const items = grouped[cat];
              if (!items?.length) return null;
              const config = categoryConfig[cat];
              return (
                <motion.section key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className={`text-xl font-bold mb-4 ${config.colorClass}`}>{config.label}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {items.map(c => (
                      <motion.div
                        key={c.id}
                        whileHover={{ y: -4 }}
                        className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-6 flex flex-col items-center text-center min-h-[300px] transition-shadow hover:shadow-lg"
                      >
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} className="w-24 h-24 rounded-2xl object-cover mb-4 border border-border/30" />
                        ) : (
                          <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center mb-4">
                            {config.icon}
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-foreground mb-2">{c.name}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{c.description}</p>
                        <a href={c.external_link} target="_blank" rel="noopener noreferrer" className="w-full">
                          <Button className={`w-full rounded-xl gap-2 ${config.btnClass}`}>
                            Acessar <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Communities;
