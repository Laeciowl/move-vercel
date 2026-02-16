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
    navigate("/cadastro");
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Movement lines - dynamic visual elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Curved movement paths */}
        <motion.div
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute top-0 left-0 w-full h-full">

          <svg className="absolute w-full h-full" viewBox="0 0 1200 800" fill="none" preserveAspectRatio="xMidYMid slice">
            <motion.path
              d="M-100 400 Q 300 200 600 400 T 1300 400"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeOpacity="0.15"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, delay: 0.8 }} />

            <motion.path
              d="M-100 500 Q 400 300 700 500 T 1400 450"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeOpacity="0.1"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.5, delay: 1 }} />

            <motion.path
              d="M-50 600 Q 350 450 650 550 T 1350 500"
              stroke="hsl(var(--primary))"
              strokeWidth="1"
              strokeOpacity="0.08"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, delay: 1.2 }} />

          </svg>
        </motion.div>

        {/* Floating dots representing people/movement */}
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-primary/30" />

        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-primary/20" />

        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -50, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-[20%] w-4 h-4 rounded-full bg-primary/25" />


        {/* Gradient accent */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-accent/40 via-accent/10 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-24">
        <div className="max-w-4xl">
          {/* Brand - BIG and prominent */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10">

            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-gradient leading-none tracking-tight">
              Movê
            </h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-muted-foreground text-lg md:text-xl mt-3 font-medium tracking-wide">

              seu hub de orientação profissional
            </motion.p>
          </motion.div>

          {/* Tagline - human, purposeful */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 leading-snug">

            Conhecimento e orientação
            <br />
            <span className="text-muted-foreground font-medium">para jovens evoluírem em suas carreiras.</span>
          </motion.h2>

          {/* Purpose statement - the WHY */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground mb-6 max-w-xl leading-relaxed font-sans">
            O Movê existe para apoiar jovens em diferentes momentos da sua jornada profissional — oferecendo orientação prática, acesso a conhecimento e conexão com mentores voluntários. Somos um projeto 100% social.



          </motion.p>

          {/* The emotional hook */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-foreground font-semibold text-lg md:text-xl mb-10 flex items-center gap-3">

            <span className="w-8 h-[2px] bg-primary rounded-full" />
            Porque ninguém constrói uma carreira sozinho.
          </motion.p>

          {/* CTA button - Unified signup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col gap-6">

            <button
              onClick={goToSignup}
              className="group inline-flex items-center justify-center gap-2 bg-gradient-hero text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-button hover:scale-105 transition-transform w-fit">

              Inscreva-se gratuitamente
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Learn more link */}
            <button
              onClick={scrollToAbout}
              className="inline-flex items-center text-foreground font-semibold text-lg hover:text-primary transition-colors underline underline-offset-4 w-fit">

              Entenda como funciona
            </button>
          </motion.div>

          {/* Tags - mission highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-16 flex flex-wrap items-center gap-3">

            {['Educação gratuita', 'Orientação de carreira', 'Mentorias voluntárias', 'Comunidade de apoio'].map((tag, i) =>
            <span
              key={i}
              className="px-4 py-2 bg-muted/50 text-muted-foreground text-sm rounded-full border border-border">

                {tag}
              </span>
            )}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - positioned to the right side */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-32 right-12 md:right-20 pointer-events-none">

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">

          <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" />
        </motion.div>
      </motion.div>

      {/* Section divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>);

};

export default HeroSection;