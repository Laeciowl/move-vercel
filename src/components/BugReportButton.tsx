import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, X, Loader2, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const BugReportButton = () => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email || !profile?.name) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Preenche todos os campos, por favor!");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("bug_reports").insert({
        user_id: user.id,
        user_email: user.email,
        user_name: profile.name,
        title: formData.title.trim(),
        description: formData.description.trim(),
        page_url: window.location.href,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Recebido! A gente vai olhar isso.");

      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFormData({ title: "", description: "" });
      }, 2000);
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    }

    setLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubmitted(false);
    setFormData({ title: "", description: "" });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 bg-destructive text-destructive-foreground p-3 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 group"
        title="Reportar erro"
      >
        <Bug className="w-5 h-5" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap text-sm font-medium">
          Reportar erro
        </span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
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
              className="bg-card rounded-2xl shadow-xl max-w-md w-full"
            >
              {submitted ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Valeu! 💙</h3>
                  <p className="text-muted-foreground">
                    A gente vai olhar isso com carinho e resolver o mais rápido possível.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                        <Bug className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">Achou um problema?</h3>
                        <p className="text-xs text-muted-foreground">Conta pra gente</p>
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
                    <p className="text-sm text-muted-foreground">
                      Encontrou algo estranho? Conta o que rolou que a gente resolve.
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Título do problema *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Ex: Botão não funciona"
                        maxLength={200}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Descrição detalhada *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
                        placeholder="Descreva o que você estava fazendo, o que esperava acontecer e o que realmente aconteceu..."
                        maxLength={2000}
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BugReportButton;
