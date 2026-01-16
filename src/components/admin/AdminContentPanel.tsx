import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Loader2, Video, FileText, Youtube, Upload, File, Download } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  { value: "video", label: "Vídeo YouTube", icon: Video },
  { value: "live", label: "Live YouTube", icon: Youtube },
  { value: "pdf", label: "PDF / Documento", icon: FileText },
  { value: "article", label: "Artigo / Link", icon: ExternalLink },
];

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";

const AdminContentPanel = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo: 20MB");
        return;
      }
      setSelectedFile(file);
      if (!newContent.title) {
        setNewContent({ ...newContent, title: file.name.replace(/\.[^/.]+$/, "") });
      }
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("content-files")
      .upload(filePath, selectedFile);

    if (uploadError) {
      toast.error("Erro ao fazer upload: " + uploadError.message);
      setUploading(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("content-files")
      .getPublicUrl(filePath);

    setUploading(false);
    return publicUrl;
  };

  const handleAddContent = async () => {
    if (!newContent.title) {
      toast.error("Título é obrigatório");
      return;
    }

    // For file types, require either a file or a URL
    const isFileType = newContent.item_type === "pdf";
    if (isFileType && !selectedFile && !newContent.url) {
      toast.error("Faça upload de um arquivo ou informe uma URL");
      return;
    }

    if (!isFileType && !newContent.url) {
      toast.error("URL é obrigatória");
      return;
    }

    setSaving(true);

    let finalUrl = newContent.url;

    // If a file was selected, upload it first
    if (selectedFile) {
      const uploadedUrl = await uploadFile();
      if (!uploadedUrl) {
        setSaving(false);
        return;
      }
      finalUrl = uploadedUrl;
    }

    const { error } = await supabase.from("content_items").insert({
      title: newContent.title,
      description: newContent.description || null,
      url: finalUrl,
      item_type: newContent.item_type,
      category: newContent.category,
    });

    if (error) {
      toast.error("Erro ao adicionar conteúdo");
      console.error(error);
    } else {
      toast.success("Conteúdo adicionado com sucesso!");
      resetForm();
      setDialogOpen(false);
      fetchContents();
    }
    setSaving(false);
  };

  const resetForm = () => {
    setNewContent({
      title: "",
      description: "",
      url: "",
      item_type: "video",
      category: "geral",
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteContent = async (id: string, url: string) => {
    setDeleting(id);

    // If it's a storage URL, try to delete the file
    if (url.includes("content-files")) {
      const pathMatch = url.match(/content-files\/(.+)$/);
      if (pathMatch) {
        await supabase.storage.from("content-files").remove([pathMatch[1]]);
      }
    }

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

  const getTypeLabel = (type: string) => {
    return ITEM_TYPES.find((t) => t.value === type)?.label || type;
  };

  const isVideoType = newContent.item_type === "video" || newContent.item_type === "live";

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
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Material</DialogTitle>
              <DialogDescription>
                Adicione vídeos, documentos ou links para a biblioteca
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Tipo de conteúdo</Label>
                <Select
                  value={newContent.item_type}
                  onValueChange={(value) => {
                    setNewContent({ ...newContent, item_type: value, url: "" });
                    setSelectedFile(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Título *</Label>
                <Input
                  value={newContent.title}
                  onChange={(e) =>
                    setNewContent({ ...newContent, title: e.target.value })
                  }
                  placeholder="Ex: Como montar um currículo de impacto"
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
                  rows={2}
                />
              </div>

              {/* For videos: only URL */}
              {isVideoType && (
                <div>
                  <Label>URL do YouTube *</Label>
                  <Input
                    value={newContent.url}
                    onChange={(e) =>
                      setNewContent({ ...newContent, url: e.target.value })
                    }
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {/* For documents: file upload or URL */}
              {!isVideoType && (
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      URL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="mt-4">
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                      >
                        {selectedFile ? (
                          <div className="flex items-center gap-3 text-sm">
                            <File className="w-8 h-8 text-primary" />
                            <div>
                              <p className="font-medium">{selectedFile.name}</p>
                              <p className="text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Clique para selecionar um arquivo
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PDF, Word, Excel, PowerPoint (máx. 20MB)
                            </p>
                          </div>
                        )}
                      </label>
                      {selectedFile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="text-muted-foreground"
                        >
                          Remover arquivo
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="url" className="mt-4">
                    <div>
                      <Label>URL do arquivo</Label>
                      <Input
                        value={newContent.url}
                        onChange={(e) =>
                          setNewContent({ ...newContent, url: e.target.value })
                        }
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

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

              <Button
                onClick={handleAddContent}
                disabled={saving || uploading}
                className="w-full"
              >
                {(saving || uploading) && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {uploading ? "Fazendo upload..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {contents.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum material cadastrado ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione vídeos, PDFs e guias para ajudar os mentorados
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contents.map((content) => (
            <div
              key={content.id}
              className="bg-muted/30 border rounded-xl p-4 flex items-start gap-4"
            >
              <div className="p-2 bg-background rounded-lg border">
                {getTypeIcon(content.item_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-medium truncate">{content.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(content.item_type)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
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
                  {content.url.includes("content-files") ? (
                    <>
                      <Download className="w-3 h-3" />
                      Baixar arquivo
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3 h-3" />
                      Abrir link
                    </>
                  )}
                </a>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDeleteContent(content.id, content.url)}
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
