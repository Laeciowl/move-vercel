import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MentorAchievementsBadgesProps {
  mentorId: string;
  allAchievements?: { icon: string; name: string }[];
}

const MentorAchievementsBadges = ({ mentorId, allAchievements }: MentorAchievementsBadgesProps) => {
  const achievements = allAchievements || [];

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
