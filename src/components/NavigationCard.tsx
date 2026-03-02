import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface NavigationCardProps {
  icon: LucideIcon;
  title: string;
  route: string;
}

const NavigationCard = ({ icon: Icon, title, route }: NavigationCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(route)}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full flex flex-col items-center justify-center gap-6 p-10 rounded-[20px] bg-card border border-border/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-[0_20px_40px_rgba(var(--primary-rgb),0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 min-h-[200px] md:min-h-[240px] lg:min-h-[280px]"
      aria-label={`Navegar para ${title}`}
    >
      <div className="w-[72px] h-[72px] rounded-[18px] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
        <Icon className="w-9 h-9 text-primary-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground text-center">
        {title}
      </h3>
    </motion.button>
  );
};

export default NavigationCard;
