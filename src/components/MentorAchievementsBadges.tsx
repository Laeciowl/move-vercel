import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MentorAchievementsBadgesProps {
  mentorUserId: string | null;
}

interface UnlockedAchievement {
  icon: string;
  name: string;
}

const MentorAchievementsBadges = ({ mentorUserId }: MentorAchievementsBadgesProps) => {
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    if (!mentorUserId) return;

    const fetch = async () => {
      const { data } = await supabase
        .from("user_achievements")
        .select("unlocked_at, achievement:achievements(icon, name)")
        .eq("user_id", mentorUserId)
        .not("unlocked_at", "is", null);

      if (data) {
        const mapped = data
          .filter((d: any) => d.achievement)
          .map((d: any) => ({
            icon: d.achievement.icon,
            name: d.achievement.name,
          }));
        setAchievements(mapped);
      }
    };

    fetch();
  }, [mentorUserId]);

  if (achievements.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-3">
      <Trophy className="w-3.5 h-3.5 text-primary shrink-0" />
      <TooltipProvider>
        {achievements.slice(0, 6).map((ach, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span className="text-sm cursor-default">{ach.icon}</span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{ach.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {achievements.length > 6 && (
          <span className="text-xs text-muted-foreground">+{achievements.length - 6}</span>
        )}
      </TooltipProvider>
    </div>
  );
};

export default MentorAchievementsBadges;
