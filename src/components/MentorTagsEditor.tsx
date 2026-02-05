import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Edit, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TagSelector, { type TagItem } from "@/components/TagSelector";
import { useTags, useMentorTags } from "@/hooks/useTags";

interface MentorTagsEditorProps {
  mentorId: string;
  onUpdate?: () => void;
}

const MentorTagsEditor = ({ mentorId, onUpdate }: MentorTagsEditorProps) => {
  const { tags: availableTags, loading: tagsLoading } = useTags();
  const { mentorTags, loading: mentorTagsLoading, updateMentorTags } = useMentorTags(mentorId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);

  useEffect(() => {
    setSelectedTags(mentorTags);
  }, [mentorTags]);

  const handleSave = async () => {
    if (selectedTags.length < 1) {
      toast.error("Selecione pelo menos 1 área de mentoria");
      return;
    }

    if (selectedTags.length > 5) {
      toast.error("Selecione no máximo 5 áreas de mentoria");
      return;
    }

    setSaving(true);
    const success = await updateMentorTags(selectedTags);
    
    if (success) {
      toast.success("Áreas de mentoria atualizadas!");
      setIsEditing(false);
      onUpdate?.();
    } else {
      toast.error("Erro ao salvar áreas de mentoria");
    }
    
    setSaving(false);
  };

  const handleCancel = () => {
    setSelectedTags(mentorTags);
    setIsEditing(false);
  };

  if (tagsLoading || mentorTagsLoading) {
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
          <Tag className="w-4 h-4 text-primary" />
          Áreas de Mentoria
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
              maxTags={5}
              minTags={1}
              title=""
              subtitle="Selecione até 5 áreas em que você pode ajudar mentorados (mínimo 1)"
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
                disabled={saving || selectedTags.length < 1}
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
            {mentorTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mentorTags.map((tag) => (
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
                Nenhuma área definida. Clique em "Editar" para adicionar.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorTagsEditor;
