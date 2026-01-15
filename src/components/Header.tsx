import { motion } from "framer-motion";

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
          className="text-2xl font-bold text-gradient"
        >
          Movê
        </button>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("sobre")}
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Sobre
          </button>
          <button
            onClick={() => scrollToSection("inscreva-se")}
            className="bg-gradient-hero text-primary-foreground px-6 py-2.5 rounded-lg font-semibold shadow-button hover:opacity-90 transition-opacity"
          >
            Inscreva-se
          </button>
        </nav>

        <button
          onClick={() => scrollToSection("inscreva-se")}
          className="md:hidden bg-gradient-hero text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm"
        >
          Inscreva-se
        </button>
      </div>
    </motion.header>
  );
};

export default Header;
