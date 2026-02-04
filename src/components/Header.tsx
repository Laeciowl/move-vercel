import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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
          <span className="text-2xl font-bold text-gradient">Movê</span>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="text-primary -rotate-45 group-hover:rotate-0 transition-transform duration-300"
          >
            <path 
              d="M5 12h14M12 5l7 7-7 7" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <nav className="hidden md:flex items-center gap-6">
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

        <Link
          to="/cadastro"
          className="md:hidden bg-gradient-hero text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm"
        >
          Inscreva-se
        </Link>
      </div>
    </motion.header>
  );
};

export default Header;
