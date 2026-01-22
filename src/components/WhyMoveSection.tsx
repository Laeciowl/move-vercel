import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { TrendingDown, Users, Briefcase, TrendingUp, Heart, ExternalLink, Lightbulb, GraduationCap, Handshake } from "lucide-react";
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
  
  // Card 1, 2, 3 - Os números mostram a realidade
  const youthStats = [
    {
      value: 14.9,
      suffix: "%",
      text: "dos jovens de 18 a 24 anos estavam desempregados no 1º trimestre de 2025 — uma taxa superior à média geral da população, mostrando grandes barreiras de entrada no mercado.",
      icon: TrendingDown,
      source: "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2025/abril/jovens-ganham-espaco-no-mercado-de-trabalho-e-impulsionam-queda-no-desemprego-e-na-informalidade",
      sourceName: "IBGE / PNAD / Ministério do Trabalho — Abril 2025"
    },
    {
      value: 4.6,
      suffix: " milhões",
      text: "de jovens de 14 a 24 anos não estudam nem trabalham, indicando exclusão tanto do mercado de trabalho quanto do sistema educacional.",
      icon: Users,
      source: "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2024/Maio/pesquisa-aponta-crescimento-no-emprego-para-a-juventude-mas-jovens-mulheres-e-negros-seguem-com-dificuldades-de-insercao",
      sourceName: "IBGE / PNAD / Ministério do Trabalho — Maio 2024"
    },
    {
      value: 20.0,
      suffix: "%",
      text: "dos jovens de 15 a 29 anos estavam nem trabalhando nem estudando em 2022, evidenciando persistência da vulnerabilidade juvenil.",
      icon: Briefcase,
      source: "https://epocanegocios.globo.com/brasil/noticia/2023/06/geracao-nem-nem-um-a-cada-cinco-jovens-brasileiros-nao-estuda-nem-trabalha-diz-ibge.ghtml",
      sourceName: "IBGE / PNAD Educação 2022"
    }
  ];

  // Card 4 - Mas por que mentoria?
  const whyMentorshipStats = [
    { value: 41, text: "dos trabalhadores brasileiros acreditam que ter um mentor é necessário para o sucesso profissional." },
    { value: 56, text: "da Geração Z reconhecem a importância da mentoria, mas apenas 32% disseram já ter tido um mentor ao longo da carreira." },
    { value: 63, text: "dos jovens da Geração Z relatam ter um mentor no trabalho (comparado a gerações mais velhas)." }
  ];

  // Cards 5, 6, 7, 8 - Impacto positivo da mentoria (grid 2x2)
  const mentorshipImpactStats = [
    {
      value: 15,
      suffix: "%",
      text: "a mais de ganhos entre 20 e 25 anos em comparação com pares sem mentores — um impacto econômico relevante no início da carreira.",
      highlight: "Jovens mentorados apresentaram, em média,",
      icon: TrendingUp,
      source: "https://www.bbbs.org/mentorship-has-a-big-impact/",
      sourceName: "Big Brothers Big Sisters of America"
    },
    {
      value: 20,
      suffix: "%",
      text: "mais propensos a frequentar a faculdade do que aqueles sem mentores, sugerindo maior acesso a oportunidades de desenvolvimento.",
      highlight: "Jovens mentorados foram",
      icon: GraduationCap,
      source: "https://www.bbbs.org/mentorship-has-a-big-impact/",
      sourceName: "Big Brothers Big Sisters of America"
    },
    {
      text: "Programas de mentoria estão associados a melhores comportamentos socioeducacionais, como redução de absenteísmo e maior engajamento, fatores que impactam positivamente as trajetórias profissionais.",
      icon: Lightbulb,
      source: "https://www.bbbs.org/mentorship-has-a-big-impact/",
      sourceName: "Big Brothers Big Sisters of America"
    },
    {
      text: "Relatórios de mentoring mostram que jovens mentorados tendem a desenvolver vínculos sociais mais fortes e maior mobilidade socioeconômica, reforçando oportunidades de carreira ao longo da vida.",
      icon: Handshake,
      source: "https://www.bbbs.org/mentorship-has-a-big-impact/",
      sourceName: "Big Brothers Big Sisters of America"
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
            Por que a Movê existe?
          </motion.p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 leading-tight">
            Os números mostram a realidade
          </h2>
        </motion.div>

        {/* Youth Reality Block - 3 cards side by side */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="mb-20"
        >
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

        {/* Card 4 - Mas por que mentoria? (centered) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="mb-20"
        >
          <motion.h3 
            variants={itemVariants}
            className="text-2xl md:text-3xl font-bold text-foreground mb-10 text-center"
          >
            Mas por que mentoria?
          </motion.h3>

          <motion.div
            variants={itemVariants}
            whileHover={{ 
              y: -8, 
              boxShadow: "0 20px 40px -15px rgba(249, 115, 22, 0.2)",
              transition: { duration: 0.3 }
            }}
            className="group relative bg-background rounded-2xl p-8 md:p-10 border border-border/50 hover:border-primary/40 transition-all duration-300 max-w-3xl mx-auto"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10">
              <motion.div 
                className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-8"
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
              >
                <Heart className="w-8 h-8" />
              </motion.div>
              
              <div className="space-y-6">
                {whyMentorshipStats.map((stat, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <span className="text-4xl md:text-5xl font-bold text-primary shrink-0">
                      <AnimatedNumber value={stat.value} suffix="%" />
                    </span>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed pt-2">
                      {stat.text}
                    </p>
                  </div>
                ))}
              </div>
              
              <a
                href="https://quarkrh.com.br/blog/pesquisa-amigos-no-ambiente-de-trabalho/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary/60 hover:text-primary underline underline-offset-4 transition-colors group/link mt-8"
              >
                <span>Pesquisa QuarkRH</span>
                <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </motion.div>

        {/* Animated Divider */}
        <motion.div 
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-32 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mb-20" 
        />

        {/* Cards 5-8 - Impacto positivo da mentoria (2x2 grid) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          <motion.h3 
            variants={itemVariants}
            className="text-2xl md:text-3xl font-bold text-foreground mb-10 text-center"
          >
            Impacto positivo da mentoria
          </motion.h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {mentorshipImpactStats.map((stat, index) => (
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
                  
                  {'value' in stat && stat.value ? (
                    <div className="mb-4">
                      <span className="text-base text-muted-foreground">{stat.highlight} </span>
                      <span className="text-3xl md:text-4xl font-bold text-primary">
                        <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                      </span>
                      <p className="text-base text-muted-foreground leading-relaxed mt-2">
                        {stat.text}
                      </p>
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground leading-relaxed mb-4">
                      {stat.text}
                    </p>
                  )}
                  
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
          <motion.p 
            className="text-xl md:text-2xl font-bold text-primary leading-relaxed"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            A Movê existe para democratizar o acesso à orientação profissional e mentoria voluntária, conectando jovens a conteúdo prático, mentores experientes e uma comunidade que fortalece trajetórias profissionais desde o começo.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyMoveSection;
