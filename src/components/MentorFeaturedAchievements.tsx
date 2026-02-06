import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy } from "lucide-react";

export interface FeaturedAchievement {
  achievement_id: string;
  icon: string;
  achievement_name: string;
  description: string;
  display_order: number;
}

interface MentorFeaturedAchievementsProps {
  achievements: FeaturedAchievement[];
}

const shortLabel = (name: string): [string, string] => {
  const parts = name.split(" ");
  if (parts.length <= 2) return [parts[0] || "", parts[1] || ""];
  return [parts[0], parts.slice(1, 3).join(" ")];
};

const MentorFeaturedAchievements = ({ achievements }: MentorFeaturedAchievementsProps) => {
  if (!achievements || achievements.length === 0) return null;

  return (
    <div className="py-3 border-t border-border/50">
      <p className="text-sm font-semibold text-foreground mb-2.5 flex items-center gap-1.5">
        <Trophy className="w-4 h-4 text-primary" />
        Conquistas
      </p>
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-4 gap-2">
          {achievements.slice(0, 4).map((ach) => {
            const [line1, line2] = shortLabel(ach.achievement_name);
            return (
              <Tooltip key={ach.achievement_id}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-primary/30 bg-primary/5 p-2 cursor-default hover:border-primary/60 hover:bg-primary/10 transition-all aspect-square min-h-[60px]">
                    <span className="text-lg leading-none mb-0.5">{ach.icon}</span>
                    <span className="text-[10px] font-medium text-foreground leading-tight text-center line-clamp-1">{line1}</span>
                    {line2 && (
                      <span className="text-[10px] text-muted-foreground leading-tight text-center line-clamp-1">{line2}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    {ach.icon} {ach.achievement_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{ach.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default MentorFeaturedAchievements;
