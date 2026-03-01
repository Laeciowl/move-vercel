import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  Target,
  BookOpen,
  HelpCircle,
  Trophy,
  Briefcase,
} from "lucide-react";
import NavigationCard from "./NavigationCard";

interface NavigationGridProps {
  isVolunteer: boolean;
  isPendingMentor: boolean;
}

const menteeCards = [
  {
    icon: Users,
    title: "Mentoria",
    description: "Encontre mentores e agende sessões de orientação profissional.",
    route: "/mentores",
  },
  {
    icon: GraduationCap,
    title: "Trilhas de Aprendizagem",
    description: "Percursos guiados para desenvolver habilidades essenciais.",
    route: "/trilhas",
  },
  {
    icon: BookOpen,
    title: "Conteúdos",
    description: "Artigos, vídeos e materiais selecionados para seu crescimento.",
    route: "/conteudos",
  },
  {
    icon: Target,
    title: "Meu PDI",
    description: "Monte seu plano de desenvolvimento individual personalizado.",
    route: "/plano",
  },
  {
    icon: Trophy,
    title: "Conquistas",
    description: "Acompanhe suas conquistas e marcos de evolução na plataforma.",
    route: "/conquistas",
  },
  {
    icon: Briefcase,
    title: "Comunidades",
    description: "Grupos parceiros com vagas, networking e oportunidades.",
    route: "/comunidades",
  },
  {
    icon: HelpCircle,
    title: "Ajuda",
    description: "Dúvidas frequentes e guias de uso da plataforma.",
    route: "/ajuda",
  },
];

const volunteerCards = [
  {
    icon: Users,
    title: "Mentoria",
    description: "Visualize seus mentorados e gerencie sessões.",
    route: "/mentores",
  },
  {
    icon: BookOpen,
    title: "Conteúdos",
    description: "Acesse e contribua com materiais para a comunidade.",
    route: "/conteudos",
  },
  {
    icon: Trophy,
    title: "Conquistas",
    description: "Veja seus badges e marcos como mentor voluntário.",
    route: "/conquistas",
  },
  {
    icon: Briefcase,
    title: "Comunidades",
    description: "Grupos parceiros e networking profissional.",
    route: "/comunidades",
  },
  {
    icon: HelpCircle,
    title: "Ajuda",
    description: "Dúvidas frequentes e guias de uso da plataforma.",
    route: "/ajuda",
  },
];

const NavigationGrid = ({ isVolunteer, isPendingMentor }: NavigationGridProps) => {
  const cards = isVolunteer ? volunteerCards : menteeCards;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Explorar
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.05 }}
          >
            <NavigationCard {...card} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default NavigationGrid;
