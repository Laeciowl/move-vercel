import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import TagSelector, { type TagItem } from "@/components/TagSelector";
import { useTags, useMenteeInterests } from "@/hooks/useTags";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface InterestsOnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const InterestsOnboardingModal = ({ open, onClose }: InterestsOnboardingModalProps) => {
  const { user, refreshProfile } = useAuth();
  const { tags: availableTags, loading: tagsLoading } = useTags();
  const { updateInterests } = useMenteeInterests(user?.id || null);
  
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);

    // Save interests if any selected
    if (selectedTags.length > 0) {
      const success = await updateInterests(selectedTags);
      if (!success) {
        toast.error("Erro ao salvar interesses");
        setSaving(false);
        return;
      }
    }

    // Mark interests_selected in profile (we can use a simple flag or just close)
    // For now, just close the modal
    toast.success(
      selectedTags.length > 0
        ? "Seus interesses foram salvos!"
        : "Você pode adicionar interesses depois no seu perfil"
    );
    
    await refreshProfile();
    setSaving(false);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-hero flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <DialogTitle className="text-2xl font-bold text-center">
            Bem-vindo à Movê! 🚀
          </DialogTitle>
          <p className="text-muted-foreground text-center mt-2">
            Vamos personalizar sua experiência.<br />
            Quais áreas te interessam?
          </p>
        </DialogHeader>

        {tagsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TagSelector
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              title=""
              subtitle="Selecione as áreas que te interessam para encontrar mentores ideais"
              showSearch
              showCategoryFilter
            />
          </motion.div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={saving}
            className="flex-1"
          >
            Pular por agora
          </Button>
          <Button
            onClick={handleContinue}
            disabled={saving}
            className="flex-1 bg-gradient-hero text-primary-foreground hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {selectedTags.length > 0
              ? `Continuar com ${selectedTags.length} interesse${selectedTags.length > 1 ? "s" : ""}`
              : "Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterestsOnboardingModal;
