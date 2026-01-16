import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Loader2, Video, FileText, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  item_type: string;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "carreira", label: "Carreira" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "soft_skills", label: "Soft Skills" },
  { value: "entrevistas", label: "Entrevistas" },
  { value: "curriculo", label: "Currículo" },
];

const ITEM_TYPES = [
  { value: "video", label: "Vídeo", icon: Video },
  { value: "article", label: "Artigo", icon: FileText },
  { value: "live", label: "Live YouTube", icon: Youtube },
];

const AdminContentPanel = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    url: "",
    item_type: "video",
    category: "geral",
  });

  const fetchContents = async () => {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar conteúdos");
      console.error(error);
    } else {
      setContents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.url) {
      toast.error("Título e URL são obrigatórios");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("content_items").insert({
      title: newContent.title,
      description: newContent.description || null,
      url: newContent.url,
      item_type: newContent.item_type,
      category: newContent.category,
    });

    if (error) {
      toast.error("Erro ao adicionar conteúdo");
      console.error(error);
    } else {
      toast.success("Conteúdo adicionado com sucesso!");
      setNewContent({
        title: "",
        description: "",
        url: "",
        item_type: "video",
        category: "geral",
      });
      setDialogOpen(false);
      fetchContents();
    }
    setSaving(false);
  };

  const handleDeleteContent = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("content_items").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir conteúdo");
      console.error(error);
    } else {
      toast.success("Conteúdo excluído");
      fetchContents();
    }
    setDeleting(null);
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = ITEM_TYPES.find((t) => t.value === type);
    if (typeConfig) {
      const Icon = typeConfig.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Materiais ({contents.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Material</DialogTitle>
              <DialogDescription>
                Adicione um novo material, vídeo ou link de live
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={newContent.title}
                  onChange={(e) =>
                    setNewContent({ ...newContent, title: e.target.value })
                  }
                  placeholder="Ex: Como montar um currículo"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newContent.description}
                  onChange={(e) =>
                    setNewContent({ ...newContent, description: e.target.value })
                  }
                  placeholder="Breve descrição do conteúdo"
                  rows={3}
                />
              </div>

              <div>
                <Label>URL *</Label>
                <Input
                  value={newContent.url}
                  onChange={(e) =>
                    setNewContent({ ...newContent, url: e.target.value })
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={newContent.item_type}
                    onValueChange={(value) =>
                      setNewContent({ ...newContent, item_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={newContent.category}
                    onValueChange={(value) =>
                      setNewContent({ ...newContent, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAddContent}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {contents.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhum material cadastrado
        </p>
      ) : (
        <div className="space-y-3">
          {contents.map((content) => (
            <div
              key={content.id}
              className="bg-card border rounded-xl p-4 flex items-start gap-4"
            >
              <div className="p-2 bg-muted rounded-lg">
                {getTypeIcon(content.item_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-medium truncate">{content.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {CATEGORIES.find((c) => c.value === content.category)?.label ||
                      content.category}
                  </Badge>
                </div>
                {content.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {content.description}
                  </p>
                )}
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver conteúdo
                </a>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDeleteContent(content.id)}
                disabled={deleting === content.id}
              >
                {deleting === content.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContentPanel;
