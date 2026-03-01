import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavigationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  route: string;
  iconBgClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
  external?: boolean;
  externalUrl?: string;
  badge?: string;
}

const NavigationCard = ({
  icon: Icon,
  title,
  description,
  route,
  iconBgClassName,
  iconClassName,
  onClick,
  external,
  externalUrl,
  badge,
}: NavigationCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (external && externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    } else {
      navigate(route);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "relative w-full text-left p-5 rounded-2xl bg-card border border-border/40",
        "hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.12)]",
        "transition-all duration-300 group cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
      )}
      aria-label={`Navegar para ${title}`}
    >
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {badge}
        </span>
      )}

      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110",
          iconBgClassName || "bg-gradient-to-br from-primary to-primary/80"
        )}
      >
        <Icon className={cn("w-5 h-5", iconClassName || "text-primary-foreground")} />
      </div>

      <h3 className="font-semibold text-foreground text-[15px] leading-tight mb-1">
        {title}
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {description}
      </p>

      <div className="mt-3 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Acessar <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
      </div>
    </motion.button>
  );
};

export default NavigationCard;
