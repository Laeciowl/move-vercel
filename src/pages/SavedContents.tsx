import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

interface SavedContent {
  id: string;
  saved_at: string;
  content: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    item_type: string;
    category: string;
    area: string;
  };
}

const SavedContents = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [saved, setSaved] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchSaved();
  }, [user]);

  const fetchSaved = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("content_saves")
      .select("id, saved_at, content_items(id, title, description, url, item_type, category, area)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (data) {
      setSaved(data.map((d: any) => ({
        id: d.id,
        saved_at: d.saved_at,
        content: d.content_items,
      })).filter(d => d.content));
    }
    setLoading(false);
  };

  const handleRemove = async (saveId: string) => {
    const { error } = await supabase
      .from("content_saves")
      .delete()
      .eq("id", saveId);

    if (!error) {
      setSaved(prev => prev.filter(s => s.id !== saveId));
    }
  };

  if (authLoading || loading) {
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
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/conteudos")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos conteúdos
        </button>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Bookmark className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Seus Conteúdos Salvos</h1>
          <p className="text-muted-foreground">Artigos e materiais que você marcou para ler depois</p>
        </motion.div>

        {saved.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-card/50 rounded-2xl border border-border/30"
          >
            <Bookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-4">Nenhum conteúdo salvo ainda</p>
            <p className="text-sm text-muted-foreground mb-4">
              Explore nossa biblioteca e salve artigos interessantes para ler depois!
            </p>
            <Button onClick={() => navigate("/conteudos")}>Explorar conteúdos</Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {saved.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/30 p-4 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{item.content.title}</h3>
                  {item.content.description && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{item.content.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{item.content.item_type}</span>
                    <a
                      href={item.content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Acessar
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-primary hover:text-primary/70 transition-colors shrink-0"
                  title="Remover dos salvos"
                >
                  <Bookmark className="w-5 h-5 fill-current" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SavedContents;
