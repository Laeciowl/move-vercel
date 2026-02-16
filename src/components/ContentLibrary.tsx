import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, FileText, BookOpen, Loader2, Play, ExternalLink, 
  X, Filter, ChevronDown, SortDesc, Bookmark, BookmarkCheck, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  item_type: string;
  category: string;
  area: string;
  created_at: string;
}

// Predefined areas (broad categories)
const AREAS = [
  { value: "carreira", label: "Carreira" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "negocios", label: "Negócios" },
  { value: "desenvolvimento", label: "Desenvolvimento Pessoal" },
  { value: "geral", label: "Geral" },
];

// Predefined themes (specific topics)
const THEMES = [
  { value: "curriculo", label: "Currículo" },
  { value: "entrevistas", label: "Entrevistas" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "dados", label: "Análise de Dados" },
  { value: "programacao", label: "Programação" },
  { value: "marketing", label: "Marketing" },
  { value: "lideranca", label: "Liderança" },
  { value: "produtividade", label: "Produtividade" },
  { value: "comunicacao", label: "Comunicação" },
  { value: "financas", label: "Finanças" },
  { value: "empreendedorismo", label: "Empreendedorismo" },
  { value: "soft_skills", label: "Soft Skills" },
  { value: "geral", label: "Geral" },
];

const areaLabels: Record<string, string> = Object.fromEntries(AREAS.map(a => [a.value, a.label]));
const themeLabels: Record<string, string> = Object.fromEntries(THEMES.map(t => [t.value, t.label]));

const typeLabels: Record<string, string> = {
  video: "Vídeo Educativo",
  pdf: "Guia / Template",
};

const ITEMS_PER_PAGE = 9;

const ContentLibrary = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTheme = searchParams.get("tema") || "all";
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedTheme, setSelectedTheme] = useState<string>(initialTheme);
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [accessedIds, setAccessedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchContents();
    if (user) {
      fetchSaves();
      fetchAccessed();
    }
  }, [user]);

  const fetchContents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setContents(data as ContentItem[]);
    }
    setLoading(false);
  };

  const fetchSaves = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("content_saves")
      .select("content_id")
      .eq("user_id", user.id);
    if (data) setSavedIds(new Set(data.map(d => d.content_id)));
  };

  const fetchAccessed = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("content_access_log")
      .select("content_id")
      .eq("user_id", user.id);
    if (data) setAccessedIds(new Set(data.map(d => d.content_id)));
  };

  const toggleSave = async (e: React.MouseEvent, contentId: string) => {
    e.stopPropagation();
    if (!user) return;
    if (savedIds.has(contentId)) {
      await supabase.from("content_saves").delete().eq("user_id", user.id).eq("content_id", contentId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(contentId); return n; });
      toast("Conteúdo removido dos salvos");
    } else {
      await supabase.from("content_saves").insert({ user_id: user.id, content_id: contentId });
      setSavedIds(prev => new Set(prev).add(contentId));
      toast("Conteúdo salvo!");
    }
  };

  const logAccess = async (contentId: string) => {
    if (!user || accessedIds.has(contentId)) return;
    await supabase.from("content_access_log").insert({ user_id: user.id, content_id: contentId });
    setAccessedIds(prev => new Set(prev).add(contentId));
  };

  // Filter and sort
  const filteredContents = contents.filter((c) => {
    const typeMatch = selectedType === "all" || c.item_type === selectedType;
    const areaMatch = selectedArea === "all" || c.area === selectedArea;
    const themeMatch = selectedTheme === "all" || c.category === selectedTheme;
    return typeMatch && areaMatch && themeMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredContents.length / ITEMS_PER_PAGE);
  const paginatedContents = filteredContents.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = page < totalPages;

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  const resetFilters = () => {
    setSelectedType("all");
    setSelectedArea("all");
    setSelectedTheme("all");
    setPage(1);
  };

  const handleContentClick = (content: ContentItem) => {
    logAccess(content.id);
    if (content.item_type === "video") {
      setSelectedContent(content);
    } else {
      window.open(content.url, "_blank");
    }
  };

  const hasActiveFilters = selectedType !== "all" || selectedArea !== "all" || selectedTheme !== "all";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.section
      id="content-library"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-6"
    >
      {/* Curated Content Disclaimer */}
      <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl p-4 border border-primary/10">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">📚 Conteúdo selecionado com carinho:</span>{" "}
          Os vídeos aqui são recomendações de materiais educacionais incríveis que encontramos no YouTube. 
          A Movê não criou esses conteúdos — nosso papel é garimpar e organizar os melhores recursos pra te ajudar a crescer.
        </p>
      </div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-soft">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Conteúdos Recomendados</h3>
            <p className="text-sm text-muted-foreground">
              {filteredContents.length} {filteredContents.length === 1 ? 'conteúdo curado' : 'conteúdos curados'} disponíveis
            </p>
          </div>
        </div>

        {/* Saved contents link */}
        {savedIds.size > 0 && (
          <a
            href="/conteudos/salvos"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <BookmarkCheck className="w-4 h-4" />
            Salvos ({savedIds.size})
          </a>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {selectedType === "all" ? "Tipo" : typeLabels[selectedType]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={() => { setSelectedType("all"); setPage(1); }}>
                Todos os tipos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedType("video"); setPage(1); }}>
                <Video className="w-4 h-4 mr-2" />
                Vídeos Educativos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedType("pdf"); setPage(1); }}>
                <FileText className="w-4 h-4 mr-2" />
                Guias / Templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Area Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SortDesc className="w-4 h-4" />
                {selectedArea === "all" ? "Área" : areaLabels[selectedArea]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={() => { setSelectedArea("all"); setPage(1); }}>
                Todas as áreas
              </DropdownMenuItem>
              {AREAS.map((area) => (
                <DropdownMenuItem key={area.value} onClick={() => { setSelectedArea(area.value); setPage(1); }}>
                  {area.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <BookOpen className="w-4 h-4" />
                {selectedTheme === "all" ? "Tema" : themeLabels[selectedTheme]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border max-h-64 overflow-y-auto">
              <DropdownMenuItem onClick={() => { setSelectedTheme("all"); setPage(1); }}>
                Todos os temas
              </DropdownMenuItem>
              {THEMES.map((theme) => (
                <DropdownMenuItem key={theme.value} onClick={() => { setSelectedTheme(theme.value); setPage(1); }}>
                  {theme.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {filteredContents.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {paginatedContents.map((content, i) => (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleContentClick(content)}
                  className="group bg-card rounded-xl border border-border/50 overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                >
                  {/* Thumbnail for videos */}
                  {content.item_type === "video" && (
                    <div className="relative aspect-video bg-muted">
                      {getYouTubeThumbnail(content.url) ? (
                        <img 
                          src={getYouTubeThumbnail(content.url)!} 
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-6 h-6 text-primary-foreground ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Icon for PDFs */}
                  {content.item_type === "pdf" && (
                    <div className="p-4 pb-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  )}

                  {/* Content Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {content.title}
                      </h4>
                      {content.item_type === "pdf" && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    
                    {content.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {content.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {content.item_type === "video" ? (
                            <>
                              <Video className="w-3 h-3 mr-1" />
                              Vídeo
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3 mr-1" />
                              Guia
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {areaLabels[content.area] || content.area}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {accessedIds.has(content.id) && (
                          <span className="text-xs text-green-600 flex items-center gap-0.5" title="Visto">
                            <Eye className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          onClick={(e) => toggleSave(e, content.id)}
                          className={`p-1 rounded-lg transition-colors ${
                            savedIds.has(content.id) 
                              ? "text-primary" 
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title={savedIds.has(content.id) ? "Remover dos salvos" : "Salvar"}
                        >
                          {savedIds.has(content.id) 
                            ? <BookmarkCheck className="w-4 h-4" /> 
                            : <Bookmark className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => p + 1)}
                className="rounded-full px-8"
              >
                Carregar mais
              </Button>
            </div>
          )}
        </>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-muted/30 to-accent/10 rounded-2xl p-12 text-center border border-border/30"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">
            {hasActiveFilters 
              ? "Nenhum conteúdo encontrado com os filtros selecionados."
              : "Em breve teremos conteúdos incríveis para você!"}
          </p>
          {hasActiveFilters && (
            <Button variant="link" onClick={resetFilters} className="mt-2">
              Limpar filtros
            </Button>
          )}
        </motion.div>
      )}

      {/* Video Modal */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-bold pr-8">
              {selectedContent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="p-4 pt-2 space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(selectedContent.url)}
                  title={selectedContent.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {selectedContent.description && (
                <p className="text-muted-foreground">
                  {selectedContent.description}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {areaLabels[selectedContent.area] || selectedContent.area}
                  </Badge>
                  <Badge variant="outline">
                    {themeLabels[selectedContent.category] || selectedContent.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  💡 Esse vídeo é uma recomendação nossa — a Movê não criou esse conteúdo.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.section>
  );
};

export default ContentLibrary;