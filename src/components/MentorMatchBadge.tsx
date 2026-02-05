import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagItem } from "@/components/TagSelector";

interface MentorMatchBadgeProps {
  matchCount: number;
  matchingTags: TagItem[];
  className?: string;
}

const MentorMatchBadge = ({ matchCount, matchingTags, className }: MentorMatchBadgeProps) => {
  if (matchCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30",
        "border-2 border-amber-400 dark:border-amber-600",
        "rounded-xl px-4 py-3 mb-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
        <span className="font-semibold text-amber-800 dark:text-amber-200">
          Este mentor tem fit com você
        </span>
      </div>
      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
        {matchCount} área{matchCount > 1 ? "s" : ""} em comum com seus interesses
      </p>
    </motion.div>
  );
};

export default MentorMatchBadge;
