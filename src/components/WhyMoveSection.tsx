import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { TrendingDown, Users, Briefcase, TrendingUp, Heart, ExternalLink } from "lucide-react";
import { useRef, useEffect, useState } from "react";

// Animated counter component
const AnimatedNumber = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const spring = useSpring(0, { 
    mass: 0.8, 
    stiffness: 50, 
    damping: 15 
  });
  
  const display = useTransform(spring, (current) => {
    if (suffix === "%") {
      return `${prefix}${current.toFixed(1).replace(".", ",")}${suffix}`;
    }
    if (suffix === " milhões") {
      return `${prefix}${current.toFixed(1).replace(".", ",")}${suffix}`;
    }
    return `${prefix}${Math.round(current)}${suffix}`;
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      spring.set(value);
      setHasAnimated(true);
    }
  }, [isInView, spring, value, hasAnimated]);

  const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`);
  
  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return <span ref={ref}>{displayValue}</span>;
};

const WhyMoveSection = () => {
  const containerRef = useRef(null);
  
  const youthStats = [
    {
      value: 14.9,
      suffix: "%",
      text: "dos jovens de 18 a 24 anos estavam desempregados no 1º trimestre de 2025",
      icon: TrendingDown,
      source: "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2025/abril/jovens-ganham-espaco-no-mercado-de-trabalho-e-impulsionam-queda-no-desemprego-e-na-informalidade",
      sourceName: "PNAD/Ministério do Trabalho - Abril 2025"
    },
    {
      value: 4.6,
      suffix: " milhões",
      text: "de jovens de 14 a 24 anos estavam fora do trabalho e da educação (nem estudam nem trabalham)",
      icon: Users,
      source: "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2024/Maio/pesquisa-aponta-crescimento-no-emprego-para-a-juventude-mas-jovens-mulheres-e-negros-seguem-com-dificuldades-de-insercao",
      sourceName: "PNAD/Ministério do Trabalho - Maio 2024"
    },
    {
      value: 20,
      suffix: "%",
      text: "dos jovens de 15 a 29 anos não estudavam nem trabalhavam — mostrando persistência do problema",
      icon: Briefcase,
      source: "https://epocanegocios.globo.com/brasil/noticia/2023/06/geracao-nem-nem-um-a-cada-cinco-jovens-brasileiros-nao-estuda-nem-trabalha-diz-ibge.ghtml",
      sourceName: "IBGE/Época Negócios - PNAD Educação 2022"
    }
  ];

  const mentorshipDescription = "Programas de mentoria e orientação profissional ajudam jovens a ganhar clareza, desenvolver habilidades, fortalecer redes e apoiar decisões sobre carreira e inserção no mercado de trabalho.";

  const mentorshipStats = [
    {
      text: "Evidências de revisões sistemáticas e meta-análises em mentoring mostram que programas estruturados de mentoria causam efeitos positivos em resultados de desenvolvimento juvenil, incluindo aspectos sociais, educacionais e profissionais, quando bem implementados.",
      icon: Heart,
      source: "https://www.ojp.gov/library/publications/effects-youth-mentoring-programs-meta-analysis-outcome-studies",
      sourceName: "Meta-análise sobre programas de mentoring"
    },
    {
      text: "Relatórios de organizações especializadas demonstram que o efeito da mentoria pode apoiar jovens em múltiplas dimensões de vida, com potencial para fortalecer empregabilidade e trajetórias profissionais por meio de conexões, rede e orientação.",
      icon: TrendingUp,
      source: "https://www.mentoring.org/resource/the-mentoring-effect/",
      sourceName: "The Mentoring Effect (MENTOR)"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <section ref={containerRef} className="pt-12 md:pt-16 pb-12 md:pb-16 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <motion.p 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-primary font-black text-lg md:text-xl tracking-widest uppercase text-center mb-8"
          >
            Por que o Movê existe
          </motion.p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 leading-tight">
            Os números mostram a necessidade
          </h2>
        </motion.div>

        {/* Youth Reality Block */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="mb-20"
        >
          <motion.h3 
            variants={itemVariants}
            className="text-xl md:text-2xl font-semibold text-foreground mb-10 text-center"
          >
            A realidade dos jovens no Brasil:
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {youthStats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  y: -8, 
                  boxShadow: "0 20px 40px -15px rgba(249, 115, 22, 0.2)",
                  transition: { duration: 0.3 }
                }}
                className="group relative bg-background rounded-2xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-300 text-center"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <motion.div 
                    className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-6"
                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                  >
                    <stat.icon className="w-7 h-7" />
                  </motion.div>
                  
                  <div className="text-5xl md:text-6xl font-bold text-primary mb-3 tracking-tight">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                  
                  <p className="text-base text-muted-foreground leading-relaxed mb-4">
                    {stat.text}
                  </p>
                  
                  <a
                    href={stat.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary/60 hover:text-primary underline underline-offset-4 transition-colors group/link"
                  >
                    <span>{stat.sourceName}</span>
                    <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Animated Divider */}
        <motion.div 
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-32 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mb-20" 
        />

        {/* Mentorship Impact Block */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          <motion.h3 
            variants={itemVariants}
            className="text-xl md:text-2xl font-semibold text-foreground mb-4 text-center"
          >
            Por que mentoria faz diferença:
          </motion.h3>

          <motion.p 
            variants={itemVariants}
            className="text-muted-foreground text-center max-w-3xl mx-auto mb-12 text-lg"
          >
            {mentorshipDescription}
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {mentorshipStats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  boxShadow: "0 20px 40px -15px rgba(249, 115, 22, 0.2)",
                  transition: { duration: 0.3 }
                }}
                className="group relative bg-background rounded-2xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-300"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <motion.div 
                    className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-6"
                    whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                  >
                    <stat.icon className="w-7 h-7" />
                  </motion.div>
                  
                  <p className="text-base text-muted-foreground leading-relaxed mb-4">
                    {stat.text}
                  </p>
                  
                  <a
                    href={stat.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary/60 hover:text-primary underline underline-offset-4 transition-colors group/link"
                  >
                    <span>{stat.sourceName}</span>
                    <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Closing Text */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 text-center max-w-3xl mx-auto"
        >
          <motion.div 
            className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-8"
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Heart className="w-8 h-8" />
          </motion.div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Quando jovens encontram direcionamento e apoio ao longo de sua jornada profissional, toda a sociedade se beneficia: com maior empregabilidade, melhor qualificação profissional e redução das desigualdades no acesso ao trabalho.
          </p>
          <motion.p 
            className="text-2xl md:text-3xl font-bold text-primary mt-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            O Movê democratiza esse acesso, conectando conteúdo, orientação e mentoria voluntária para jovens em suas jornadas profissionais.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyMoveSection;
