import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToAbout = () => {
    const element = document.getElementById("sobre");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const goToSignup = () => {
    navigate("/auth?cadastro=true");
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Minimal geometric accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/30 to-transparent" />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-20 right-[15%] w-64 h-64 rounded-full border-[3px] border-primary/20"
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-32 right-[25%] w-32 h-32 rounded-full bg-primary/10"
      />

      <div className="container mx-auto px-4 relative z-10 pt-24">
        <div className="max-w-4xl">
          {/* Small human touch badge */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-primary font-medium text-sm md:text-base mb-6 tracking-wide"
          >
            ✦ Feito por pessoas, para pessoas
          </motion.p>

          {/* Main headline - more human, less corporate */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-8 text-foreground"
          >
            Sua próxima
            <br />
            <span className="text-gradient">oportunidade</span>
            <br />
            começa aqui.
          </motion.h1>

          {/* Subheadline - conversational, warm */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl leading-relaxed"
          >
            O Movê é um projeto social que conecta quem está buscando 
            um emprego com mentores voluntários dispostos a ajudar. 
            <span className="text-foreground font-medium"> Porque ninguém deveria caminhar sozinho.</span>
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={goToSignup}
              className="group inline-flex items-center justify-center gap-2 bg-gradient-hero text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-button hover:scale-105 transition-transform"
            >
              Começar agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={scrollToAbout}
              className="inline-flex items-center justify-center text-foreground px-8 py-4 font-semibold text-lg hover:text-primary transition-colors"
            >
              Saiba mais sobre nós
            </button>
          </motion.div>

          {/* Social proof - human touch */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 pt-8 border-t border-border/50"
          >
            <p className="text-muted-foreground text-sm">
              Já ajudamos dezenas de pessoas a darem o próximo passo na carreira.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
