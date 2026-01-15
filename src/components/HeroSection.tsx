import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const scrollToAbout = () => {
    const element = document.getElementById("sobre");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSignup = () => {
    const element = document.getElementById("inscreva-se");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-transparent to-secondary/20" />
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 right-20 w-20 h-20 bg-primary/20 rounded-full blur-xl hidden lg:block"
      />
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-40 left-20 w-32 h-32 bg-secondary/30 rounded-full blur-2xl hidden lg:block"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full mb-8 shadow-soft"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Projeto Social de Educação</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6"
            >
              <span className="text-foreground">Um guia para</span>
              <br />
              <span className="text-foreground">sua jornada</span>
              <br />
              <span className="text-card bg-secondary px-4 py-1 rounded-xl inline-block">profissional.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-md mx-auto lg:mx-0"
            >
              Capacitação gratuita para quem precisa de apoio na jornada profissional. 
              LinkedIn, currículo, mentoria e uma comunidade que te acolhe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button
                onClick={scrollToSignup}
                className="group bg-gradient-hero text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg shadow-button hover:scale-105 transition-transform"
              >
                Quero participar
              </button>
              <button
                onClick={scrollToAbout}
                className="border-2 border-border text-foreground px-8 py-4 rounded-2xl font-bold text-lg hover:bg-muted transition-colors"
              >
                Conhecer mais
              </button>
            </motion.div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="hidden lg:block">
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 40, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: -3 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-card/90 backdrop-blur-md p-6 rounded-3xl shadow-card mb-4 ml-12"
              >
                <p className="text-2xl font-bold text-foreground mb-1">LinkedIn</p>
                <p className="text-muted-foreground">Perfil que atrai recrutadores</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40, rotate: 2 }}
                animate={{ opacity: 1, y: 0, rotate: 2 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="bg-card/90 backdrop-blur-md p-6 rounded-3xl shadow-card mb-4 mr-12"
              >
                <p className="text-2xl font-bold text-foreground mb-1">Currículo</p>
                <p className="text-muted-foreground">Destaque suas habilidades</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-gradient-hero p-6 rounded-3xl shadow-button ml-8"
              >
                <p className="text-2xl font-bold text-primary-foreground mb-1">Mentoria</p>
                <p className="text-primary-foreground/80">Voluntários que te guiam</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.button
          onClick={scrollToAbout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ 
            opacity: { delay: 1, duration: 0.5 },
            y: { delay: 1, duration: 1.5, repeat: Infinity }
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-sm font-medium">Saiba mais</span>
          <ArrowDown className="w-5 h-5" />
        </motion.button>
      </div>
    </section>
  );
};

export default HeroSection;
