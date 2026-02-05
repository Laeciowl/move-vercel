import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Edit, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TagSelector, { type TagItem } from "@/components/TagSelector";
import { useTags, useMenteeInterests } from "@/hooks/useTags";
import { useAuth } from "@/contexts/AuthContext";

interface MenteeInterestsEditorProps {
  onUpdate?: () => void;
}

const MenteeInterestsEditor = ({ onUpdate }: MenteeInterestsEditorProps) => {
  const { user } = useAuth();
  const { tags: availableTags, loading: tagsLoading } = useTags();
  const { interests, loading: interestsLoading, updateInterests } = useMenteeInterests(user?.id || null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);

  useEffect(() => {
    setSelectedTags(interests);
  }, [interests]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateInterests(selectedTags);
    
    if (success) {
      toast.success("Seus interesses foram atualizados!");
      setIsEditing(false);
      onUpdate?.();
    } else {
      toast.error("Erro ao salvar interesses");
    }
    
    setSaving(false);
  };

  const handleCancel = () => {
    setSelectedTags(interests);
    setIsEditing(false);
  };

  if (tagsLoading || interestsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Meus Interesses
        </h4>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-primary hover:bg-primary/10 gap-1.5"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 bg-accent/30 rounded-xl p-4 border border-border/50"
          >
            <TagSelector
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              title=""
              subtitle="Selecione as áreas que te interessam para receber recomendações personalizadas de mentores"
            />

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Salvar
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-muted/30 rounded-xl p-4 border border-border/50"
          >
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Nenhum interesse definido. Adicione seus interesses para encontrar mentores que combinam com você.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenteeInterestsEditor;
