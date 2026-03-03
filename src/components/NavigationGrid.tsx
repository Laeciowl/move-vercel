import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Target,
  BookOpen,
  HelpCircle,
  Trophy,
  Calendar,
  MessageCircle,
  Users2,
} from "lucide-react";
import NavigationCard from "./NavigationCard";

const WHATSAPP_MENTORADOS = "https://chat.whatsapp.com/JugF130879CH7Lgo2Ycs1b";
const WHATSAPP_MENTORES = "https://chat.whatsapp.com/LINK_MENTORES";

interface NavigationGridProps {
  isVolunteer: boolean;
  isMentor?: boolean;
}

const menteeCards = [
  { icon: Target, title: "Meu PDI", route: "/plano" },
  { icon: GraduationCap, title: "Trilhas de Aprendizagem", route: "/trilhas" },
  { icon: BookOpen, title: "Conteúdos", route: "/conteudos" },
  { icon: Trophy, title: "Conquistas", route: "/conquistas" },
  { icon: Users, title: "Mentoria", route: "/mentores" },
  { icon: MessageCircle, title: "WhatsApp", externalUrl: WHATSAPP_MENTORADOS },
  { icon: Users2, title: "Comunidades Parceiras", route: "/comunidades" },
  { icon: HelpCircle, title: "Ajuda", route: "/ajuda" },
];

const volunteerCards = [
  { icon: Users, title: "Área de Mentoria", route: "/mentores" },
  { icon: Calendar, title: "Agenda", route: "/mentor/agenda" },
  { icon: Trophy, title: "Conquistas", route: "/conquistas" },
  { icon: MessageCircle, title: "WhatsApp", externalUrl: WHATSAPP_MENTORES },
  { icon: HelpCircle, title: "Ajuda", route: "/ajuda" },
];

const NavigationGrid = ({ isVolunteer }: NavigationGridProps) => {
  const cards = isVolunteer ? volunteerCards : menteeCards;

  return (
    <div className={`grid gap-4 md:gap-6 lg:gap-8 ${
      isVolunteer 
        ? "grid-cols-1 sm:grid-cols-2" 
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    }`}>
      {cards.map((card, i) => (
        <motion.div
          key={card.route}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <NavigationCard {...card} />
        </motion.div>
      ))}
    </div>
  );
};

export default NavigationGrid;
