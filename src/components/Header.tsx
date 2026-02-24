import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logoMove from "@/assets/logo-move.png";

const Header = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-1.5 group"
        >
          <img src={logoMove} alt="Movê" className="h-8 w-auto" />
        </button>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/mentores"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Conheça nossos mentores
          </Link>
          <button
            onClick={() => scrollToSection("sobre")}
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Sobre
          </button>
          <Link
            to="/auth"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="bg-gradient-hero text-primary-foreground px-6 py-2.5 rounded-lg font-semibold shadow-button hover:opacity-90 transition-opacity"
          >
            Inscreva-se
          </Link>
        </nav>

        <div className="md:hidden flex items-center gap-3">
          <Link
            to="/auth"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="bg-gradient-hero text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm"
          >
            Inscreva-se
          </Link>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
