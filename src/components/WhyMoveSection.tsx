import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { TrendingDown, Users, Briefcase, GraduationCap, TrendingUp, Heart, ExternalLink } from "lucide-react";
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
      text: "dos jovens de 18 a 24 anos estão desempregados",
      icon: TrendingDown,
      source: "https://www.poder360.com.br/poder-economia/taxa-de-desemprego-entre-jovens-atinge-149-no-1o-tri/",
      sourceName: "IBGE/Poder360 - Maio 2025"
    },
    {
      value: 26.4,
      suffix: "%",
      text: "dos adolescentes de 14 a 17 anos estão desempregados",
      icon: Users,
      source: "https://agenciabrasil.ebc.com.br/economia/noticia/2025-05/taxa-de-desemprego-cresce-em-12-estados-no-primeiro-trimestre",
      sourceName: "IBGE/Agência Brasil - Maio 2025"
    },
    {
      value: 5.3,
      suffix: " milhões",
      text: "de jovens não estudam nem trabalham",
      icon: Briefcase,
      source: "https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2025/abril/jovens-ganham-espaco-no-mercado-de-trabalho-e-impulsionam-queda-no-desemprego-e-na-informalidade",
      sourceName: "Ministério do Trabalho - Abril 2025"
    }
  ];

  const mentorshipStats = [
    {
      value: 99,
      suffix: "%",
      text: "dos jovens mentorados afirmam que o impacto foi alto em suas vidas",
      icon: Heart,
      source: "https://fesagroup.com/blog/jovens-recebem-mentorias-para-aumentar-a-empregabilidade-e-conquistarem-a-tao-sonhada-vaga-no-mercado-de-trabalho/",
      sourceName: "FESA C.R.O.M.A., Brasil 2021-2024"
    },
    {
      value: 20,
      suffix: "%",
      text: "de aumento em ganhos entre 20 e 25 anos",
      icon: TrendingUp,
      source: "https://www.prnewswire.com/news-releases/big-brothers-big-sisters-of-america-launches-groundbreaking-research-on-the-long-term-impacts-of-mentorship-302360477.html",
      sourceName: "Big Brothers Big Sisters - Harvard/US Treasury 2025"
    },
    {
      value: 52,
      suffix: "%",
      text: "menos ausências escolares comparado a não mentorados",
      icon: GraduationCap,
      source: "https://www.bbbsbroward.org/bbbs-mentor-statistics/",
      sourceName: "Big Brothers Big Sisters Impact Study"
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
    <section ref={containerRef} className="py-24 md:py-32 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden">
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
            className="text-primary font-medium text-sm mb-4 tracking-wide"
          >
            ✦ Por que o Movê existe
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
            className="text-muted-foreground text-center max-w-2xl mx-auto mb-12 text-lg"
          >
            Jovens com acesso a mentores desenvolvem competências, ganham clareza sobre carreira e tomam decisões mais conscientes.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mentorshipStats.map((stat, index) => (
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
            Quando jovens encontram direcionamento, toda a sociedade ganha: redução do desemprego juvenil, melhor qualificação profissional e diminuição da desigualdade de oportunidades.
          </p>
          <motion.p 
            className="text-2xl md:text-3xl font-bold text-primary mt-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            O Movê democratiza esse acesso.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyMoveSection;
