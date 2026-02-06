import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Trophy, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Achievement {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked_at: string | null;
}

interface Props {
  mentorId: string;
}

const MentorFeaturedAchievementsEditor = ({ mentorId }: Props) => {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, mentorId]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch unlocked achievements for this user
    const { data: userAch } = await supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at, achievements(id, icon, name, description)")
      .eq("user_id", user.id)
      .not("unlocked_at", "is", null);

    const unlocked: Achievement[] = (userAch || [])
      .filter((ua: any) => ua.achievements)
      .map((ua: any) => ({
        id: ua.achievements.id,
        icon: ua.achievements.icon,
        name: ua.achievements.name,
        description: ua.achievements.description,
        unlocked_at: ua.unlocked_at,
      }));

    setUnlockedAchievements(unlocked);

    // Fetch current featured selections
    const { data: featured } = await supabase
      .from("mentor_featured_achievements")
      .select("achievement_id, display_order")
      .eq("mentor_id", mentorId)
      .order("display_order", { ascending: true });

    if (featured) {
      setSelectedIds(featured.map((f: any) => f.achievement_id));
    }

    setLoading(false);
  };

  const toggleAchievement = (achId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(achId)) {
        return prev.filter(id => id !== achId);
      }
      if (prev.length >= 4) {
        toast.error("Máximo de 4 conquistas em destaque");
        return prev;
      }
      return [...prev, achId];
    });
  };

  const handleSave = async () => {
    setSaving(true);

    // Delete all existing
    await supabase
      .from("mentor_featured_achievements")
      .delete()
      .eq("mentor_id", mentorId);

    // Insert selected
    if (selectedIds.length > 0) {
      const rows = selectedIds.map((achId, index) => ({
        mentor_id: mentorId,
        achievement_id: achId,
        display_order: index + 1,
      }));

      const { error } = await supabase
        .from("mentor_featured_achievements")
        .insert(rows);

      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        setSaving(false);
        return;
      }
    }

    toast.success("Conquistas em destaque atualizadas!");
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (unlockedAchievements.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        <Trophy className="w-4 h-4 inline mr-1" />
        Nenhuma conquista desbloqueada ainda. Continue mentorando para desbloquear!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">
          Conquistas em Destaque no Perfil Público
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Escolha até 4 conquistas para exibir no seu card ({selectedIds.length}/4 selecionadas)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <TooltipProvider>
          {unlockedAchievements.map((ach) => {
            const isSelected = selectedIds.includes(ach.id);
            return (
              <button
                key={ach.id}
                onClick={() => toggleAchievement(ach.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/30 bg-card/60"
                }`}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 shrink-0">
                  <span className="text-lg">{ach.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ach.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{ach.description}</p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </button>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Preview */}
      {selectedIds.length > 0 && (
        <div className="bg-card/60 rounded-xl border border-border/50 p-4">
          <p className="text-xs text-muted-foreground mb-2">Preview no card:</p>
          <div className="grid grid-cols-4 gap-2 max-w-[280px]">
            {selectedIds.map((achId) => {
              const ach = unlockedAchievements.find(a => a.id === achId);
              if (!ach) return null;
              const parts = ach.name.split(" ");
              return (
                <div
                  key={achId}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-primary/30 bg-primary/5 p-2 aspect-square min-h-[60px]"
                >
                  <span className="text-lg leading-none mb-0.5">{ach.icon}</span>
                  <span className="text-[10px] font-medium text-foreground leading-tight text-center line-clamp-1">{parts[0]}</span>
                  {parts.length > 1 && (
                    <span className="text-[10px] text-muted-foreground leading-tight text-center line-clamp-1">{parts.slice(1, 3).join(" ")}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Salvar Conquistas em Destaque
      </Button>
    </div>
  );
};

export default MentorFeaturedAchievementsEditor;
