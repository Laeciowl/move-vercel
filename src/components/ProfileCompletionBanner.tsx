import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Camera, FileText, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ProfileCompletionBanner = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `profile_banner_dismissed_${new Date().toDateString()}`;
    if (localStorage.getItem(key)) setDismissed(true);
  }, []);

  if (!profile || dismissed) return null;

  const missing: string[] = [];
  if (!profile.photo_url) missing.push("foto de perfil");
  if (!profile.phone) missing.push("telefone");
  if (!profile.description) missing.push("descrição");

  if (missing.length === 0) return null;

  const handleDismiss = () => {
    const key = `profile_banner_dismissed_${new Date().toDateString()}`;
    localStorage.setItem(key, "1");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/50 rounded-2xl p-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground">
              Complete seu perfil! 📝
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Falta adicionar: {missing.join(", ")}. Um perfil completo ajuda mentores a te conhecerem melhor!
            </p>
            <Button
              size="sm"
              onClick={() => navigate("/inicio?editarPerfil=1")}
              className="mt-2 h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg gap-1"
            >
              <Camera className="w-3 h-3" />
              Completar Perfil
            </Button>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-amber-200/50 transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-amber-600" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileCompletionBanner;
