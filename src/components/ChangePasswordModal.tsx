import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Eye, EyeOff, Lock, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Strong password validation schema
const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(72, "Senha muito longa")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial");

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const requirements = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Letra minúscula", met: /[a-z]/.test(password) },
    { label: "Número", met: /[0-9]/.test(password) },
    { label: "Caractere especial", met: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!password) return null;

  const metCount = requirements.filter((r) => r.met).length;
  const strength = metCount === 5 ? "Forte" : metCount >= 3 ? "Média" : "Fraca";
  const strengthColor =
    metCount === 5 ? "text-green-600" : metCount >= 3 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              metCount === 5
                ? "bg-green-500 w-full"
                : metCount >= 3
                ? "bg-yellow-500 w-3/5"
                : metCount >= 1
                ? "bg-red-500 w-1/5"
                : "w-0"
            }`}
          />
        </div>
        <span className={`text-xs font-medium ${strengthColor}`}>{strength}</span>
      </div>
      <ul className="grid grid-cols-2 gap-1 text-xs">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-1 ${
              req.met ? "text-green-600" : "text-muted-foreground"
            }`}
          >
            {req.met ? (
              <Check className="w-3 h-3 shrink-0" />
            ) : (
              <X className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password strength
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error("Erro ao alterar senha: " + error.message);
      } else {
        toast.success("Senha alterada com sucesso! 🔐");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      }
    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-card rounded-2xl shadow-xl z-50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Alterar Senha</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                    placeholder="Digite a nova senha"
                    required
                    minLength={8}
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirmar nova senha
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Digite novamente a senha"
                  required
                  minLength={8}
                  maxLength={72}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">As senhas não coincidem</p>
                )}
                {confirmPassword && newPassword === confirmPassword && newPassword.length >= 8 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Senhas coincidem
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-muted transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="flex-1 bg-gradient-hero text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Alterar Senha
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChangePasswordModal;
