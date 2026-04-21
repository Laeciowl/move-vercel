import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onDeleted: () => void;
}

const DeleteAccountModal = ({ isOpen, onClose, userName, onDeleted }: DeleteAccountModalProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const expectedText = "DELETAR MINHA CONTA";
  const canDelete = confirmText === expectedText;

  const handleDelete = async () => {
    if (!canDelete) return;

    setDeleting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente e tente outra vez.");
        return;
      }

      const { data, error } = await supabase.functions.invoke("delete-user-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        let msg = error.message || "Tente novamente";
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            if (typeof body?.error === "string") msg = body.error;
          } catch {
            /* ignore */
          }
        }
        throw new Error(msg);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Sua conta foi deletada. Sentiremos sua falta! 💙");
      onDeleted();
    } catch (err: unknown) {
      console.error("Error deleting account:", err);
      const msg = err instanceof Error ? err.message : "Tente novamente";
      toast.error("Erro ao deletar conta: " + msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[99]"
          />

          {/* Modal Container - Flex centering */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] pointer-events-auto"
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-destructive/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Deletar Conta</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-destructive">
                  ⚠️ Atenção: Esta ação é irreversível!
                </p>
                <p className="text-sm text-muted-foreground">
                  Ao deletar sua conta, todos os seus dados serão permanentemente removidos:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Perfil e informações pessoais</li>
                  <li>Histórico de sessões de mentoria</li>
                  <li>Foto de perfil</li>
                  <li>Notificações e mensagens</li>
                  {userName && <li>Dados associados a "{userName}"</li>}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Para confirmar, digite <span className="font-bold text-destructive">{expectedText}</span>
                </label>
                <Input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Digite aqui para confirmar"
                  className="font-mono"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="flex-1"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deletando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Deletar conta
                    </>
                  )}
                </Button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccountModal;