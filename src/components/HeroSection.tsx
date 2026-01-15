import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  const scrollToSignup = () => {
    const element = document.getElementById("inscreva-se");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Jovens estudando juntos"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block bg-primary/20 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-6 backdrop-blur-sm border border-primary/30"
          >
            Projeto Social de Educação
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight mb-6"
          >
            Comece sua jornada profissional com o{" "}
            <span className="text-primary">Movê</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed"
          >
            Capacitação gratuita para quem está começando no mercado de trabalho 
            ou buscando recolocação. LinkedIn, currículo, mentoria e uma 
            comunidade que te apoia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={scrollToSignup}
              className="group bg-gradient-hero text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg shadow-button hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Quero participar
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById("sobre")?.scrollIntoView({ behavior: "smooth" })}
              className="border-2 border-primary-foreground/30 text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-foreground/10 transition-colors"
            >
              Saiba mais
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
