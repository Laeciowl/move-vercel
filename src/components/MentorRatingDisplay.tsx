import { Star } from "lucide-react";

interface MentorRatingDisplayProps {
  averageRating: number;
  totalReviews: number;
  size?: "sm" | "md" | "lg";
}

const MentorRatingDisplay = ({
  averageRating,
  totalReviews,
  size = "md",
}: MentorRatingDisplayProps) => {
  const sizeClasses = {
    sm: { star: "w-3 h-3", text: "text-xs" },
    md: { star: "w-4 h-4", text: "text-sm" },
    lg: { star: "w-5 h-5", text: "text-base" },
  };

  const { star, text } = sizeClasses[size];

  if (totalReviews === 0) {
    return (
      <div className={`flex items-center gap-1 ${text} text-muted-foreground`}>
        <Star className={`${star} text-muted-foreground/30`} />
        <span>Sem avaliações</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${text}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`${star} ${
              s <= Math.round(averageRating)
                ? "fill-yellow-400 text-yellow-400"
                : s - 0.5 <= averageRating
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="font-medium text-foreground">
        {averageRating.toFixed(1)}
      </span>
      <span className="text-muted-foreground">
        ({totalReviews} {totalReviews === 1 ? "avaliação" : "avaliações"})
      </span>
    </div>
  );
};

export default MentorRatingDisplay;
