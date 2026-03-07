import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface NavigationCardProps {
  icon: LucideIcon;
  title: string;
  route?: string;
  externalUrl?: string;
  badge?: number;
}

const NavigationCard = ({ icon: Icon, title, route, externalUrl, badge }: NavigationCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (externalUrl) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    } else if (route) {
      navigate(route);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative w-full flex flex-col items-center justify-center gap-3 p-4 md:p-6 rounded-2xl bg-card border border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-[0_20px_40px_rgba(var(--primary-rgb),0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 min-h-[90px] md:min-h-[140px] lg:min-h-[160px]"
      aria-label={`Navegar para ${title}`}
    >
      {badge && badge > 0 ? (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
          {badge}
        </span>
      ) : null}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground text-center">
        {title}
      </h3>
    </motion.button>
  );
};

export default NavigationCard;
