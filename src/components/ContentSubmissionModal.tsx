import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Video, FileText, Loader2, CheckCircle, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ContentSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: "aulas_lives" | "templates_arquivos";
}

const categoryInfo = {
  aulas_lives: {
    label: "Aula / Live",
    icon: Video,
    description: "Compartilhe um link para sua aula ou transmissão ao vivo (YouTube, Google Drive, etc.)",
    contentType: "link" as const,
  },
  templates_arquivos: {
    label: "Template / Arquivo",
    icon: FileText,
    description: "Faça upload de um arquivo PDF, documento ou template para ajudar os participantes",
    contentType: "file" as const,
  },
};

const ContentSubmissionModal = ({ isOpen, onClose, onSuccess, category }: ContentSubmissionModalProps) => {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const info = categoryInfo[category];
  const Icon = info.icon;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.email || !profile?.name) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Por favor, adicione um título");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Por favor, adicione uma descrição");
      return;
    }

    if (info.contentType === "link" && !formData.url.trim()) {
      toast.error("Por favor, adicione o link");
      return;
    }

    if (info.contentType === "file" && !file) {
      toast.error("Por favor, faça upload do arquivo");
      return;
    }

    setLoading(true);

    try {
      let contentUrl = formData.url;

      // Upload file if it's a file submission
      if (info.contentType === "file" && file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("volunteer-content")
          .upload(fileName, file);

        if (uploadError) {
          throw new Error("Erro ao fazer upload do arquivo: " + uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from("volunteer-content")
          .getPublicUrl(fileName);
        contentUrl = urlData.publicUrl;
      }

      const { error: submissionError } = await supabase
        .from("volunteer_submissions")
        .insert({
          volunteer_email: user.email,
          volunteer_name: profile.name,
          category: category,
          title: formData.title.trim(),
          description: formData.description.trim(),
          content_type: info.contentType,
          content_url: contentUrl,
        });

      if (submissionError) {
        throw submissionError;
      }

      setSubmitted(true);
      toast.success("Conteúdo enviado para aprovação!");
      
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 1500);
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", url: "" });
    setFile(null);
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {submitted ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Conteúdo enviado!</h3>
              <p className="text-muted-foreground">
                Seu conteúdo será revisado pela equipe e, após aprovação, ficará disponível para todos os participantes.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Enviar {info.label}</h3>
                    <p className="text-xs text-muted-foreground">Contribua com o Movê</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {info.description}
                </p>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: Como criar um currículo impactante"
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                    placeholder="Descreva o conteúdo e como ele pode ajudar os participantes..."
                    maxLength={1000}
                    required
                  />
                </div>

                {info.contentType === "link" ? (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Link do conteúdo *
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="https://youtube.com/watch?v=..."
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Arquivo *
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      className="hidden"
                    />
                    
                    {file ? (
                      <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="p-1 rounded-full hover:bg-background transition-colors"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-6 border-2 border-dashed border-input rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Clique para selecionar um arquivo
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX (máx. 10MB)
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar para aprovação"
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContentSubmissionModal;
