import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface MentorDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
}

const MentorDisclaimerModal = ({ isOpen, onClose, onAccept }: MentorDisclaimerModalProps) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    await onAccept();
    setLoading(false);
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
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-4 right-4 top-[10vh] md:left-1/2 md:right-auto md:top-[15vh] md:-translate-x-1/2 md:max-w-lg md:w-full bg-card rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Compromisso como mentor no Movê</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <p className="text-muted-foreground">
                Ao atuar como mentor no Movê, você concorda em:
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">
                    Ser <strong>empático, respeitoso e acolhedor</strong> em todas as interações
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">
                    Ter <strong>compromisso com os horários</strong> e expectativas acordadas com o mentorado
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">
                    <strong>Comunicar-se com o mentorado</strong> com pelo menos 24 horas de antecedência para confirmar a sessão
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">
                    Utilizar os <strong>dados de contato</strong> disponibilizados exclusivamente para fins de confirmação da mentoria
                  </span>
                </li>
              </ul>

              <div className="bg-accent/50 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  Esses princípios garantem uma experiência positiva, segura e justa para todos.
                </p>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <p className="text-sm text-foreground font-medium mb-1">📖 Dica importante!</p>
                <p className="text-sm text-muted-foreground">
                  Após ativar seu perfil, confira o <strong>"Guia de como aproveitar a plataforma"</strong> no seu dashboard. 
                  Lá você encontrará dicas detalhadas de como se comunicar com mentorados e conduzir mentorias de sucesso!
                </p>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="disclaimer-accept"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked === true)}
                  className="mt-1"
                />
                <label 
                  htmlFor="disclaimer-accept" 
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Li e concordo com os compromissos de mentor no Movê
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-muted transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!accepted || loading}
                  className="flex-1 bg-gradient-hero text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar e Ativar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MentorDisclaimerModal;
