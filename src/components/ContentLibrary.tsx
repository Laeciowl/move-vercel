import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, FileText, BookOpen, Loader2, Play, ExternalLink, 
  X, Filter, ChevronDown, SortDesc
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  item_type: string;
  category: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  curriculo: "Currículo",
  marketing: "Marketing Pessoal",
  tecnologia: "Tecnologia",
  soft_skills: "Soft Skills",
  geral: "Geral",
};

const typeLabels: Record<string, string> = {
  video: "Vídeo Educativo",
  pdf: "Guia / Template",
};

const ITEMS_PER_PAGE = 9;

const ContentLibrary = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    fetchContents();
  }, []);

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

  // Filter and sort
  const filteredContents = contents.filter((c) => {
    const typeMatch = selectedType === "all" || c.item_type === selectedType;
    const categoryMatch = selectedCategory === "all" || c.category === selectedCategory;
    return typeMatch && categoryMatch;
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
    setSelectedCategory("all");
    setPage(1);
  };

  const handleContentClick = (content: ContentItem) => {
    if (content.item_type === "video") {
      setSelectedContent(content);
    } else {
      window.open(content.url, "_blank");
    }
  };

  const uniqueCategories = Array.from(new Set(contents.map(c => c.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
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

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SortDesc className="w-4 h-4" />
                {selectedCategory === "all" ? "Tema" : categoryLabels[selectedCategory]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={() => { setSelectedCategory("all"); setPage(1); }}>
                Todos os temas
              </DropdownMenuItem>
              {uniqueCategories.map((cat) => (
                <DropdownMenuItem key={cat} onClick={() => { setSelectedCategory(cat); setPage(1); }}>
                  {categoryLabels[cat] || cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Filters */}
          {(selectedType !== "all" || selectedCategory !== "all") && (
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

                    <div className="flex items-center gap-2 pt-1">
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
                        {categoryLabels[content.category] || content.category}
                      </Badge>
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
            {selectedType !== "all" || selectedCategory !== "all" 
              ? "Nenhum conteúdo encontrado com os filtros selecionados."
              : "Em breve teremos conteúdos incríveis para você!"}
          </p>
          {(selectedType !== "all" || selectedCategory !== "all") && (
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
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {categoryLabels[selectedContent.category] || selectedContent.category}
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