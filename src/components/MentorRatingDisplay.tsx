import { MessageSquare } from "lucide-react";

interface MentorRatingDisplayProps {
  totalReviews: number;
  size?: "sm" | "md" | "lg";
}

const MentorRatingDisplay = ({
  totalReviews,
  size = "md",
}: MentorRatingDisplayProps) => {
  const sizeClasses = {
    sm: { icon: "w-3 h-3", text: "text-xs" },
    md: { icon: "w-4 h-4", text: "text-sm" },
    lg: { icon: "w-5 h-5", text: "text-base" },
  };

  const { icon, text } = sizeClasses[size];

  if (totalReviews === 0) {
    return (
      <div className={`flex items-center gap-1 ${text} text-muted-foreground`}>
        <MessageSquare className={`${icon} text-muted-foreground/30`} />
        <span>Sem feedbacks</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${text}`}>
      <MessageSquare className={`${icon} text-primary`} />
      <span className="text-muted-foreground">
        {totalReviews} {totalReviews === 1 ? "feedback" : "feedbacks"}
      </span>
    </div>
  );
};

export default MentorRatingDisplay;
