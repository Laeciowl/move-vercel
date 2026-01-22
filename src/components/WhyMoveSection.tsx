import { motion } from "framer-motion";
import { TrendingDown, Users, Briefcase, GraduationCap, TrendingUp, Heart, Target } from "lucide-react";

const WhyMoveSection = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  const youthStats = [
    {
      number: "14,9%",
      text: "dos jovens de 18 a 24 anos estão desempregados",
      detail: "(dobro da média nacional)",
      icon: TrendingDown
    },
    {
      number: "5,3 milhões",
      text: "de jovens não estudam nem trabalham",
      detail: "",
      icon: Users
    },
    {
      number: "50%",
      text: "trabalham em apenas 20 ocupações de baixa qualificação",
      detail: "",
      icon: Briefcase
    }
  ];

  const mentorshipStats = [
    {
      number: "99%",
      text: "dos jovens mentorados afirmam que o impacto foi alto em suas vidas",
      icon: Heart,
      source: "https://fesagroup.com/blog/jovens-recebem-mentorias-para-aumentar-a-empregabilidade-e-conquistarem-a-tao-sonhada-vaga-no-mercado-de-trabalho/",
      sourceName: "FESA C.R.O.M.A., Brasil 2021-2024"
    },
    {
      number: "20%",
      text: "de aumento em ganhos entre 20 e 25 anos",
      icon: TrendingUp,
      source: "https://www.prnewswire.com/news-releases/big-brothers-big-sisters-of-america-launches-groundbreaking-research-on-the-long-term-impacts-of-mentorship-302360477.html",
      sourceName: "Big Brothers Big Sisters - Harvard/US Treasury 2025"
    },
    {
      number: "52%",
      text: "menos ausências escolares comparado a não mentorados",
      icon: GraduationCap,
      source: "https://www.bbbsbroward.org/bbbs-mentor-statistics/",
      sourceName: "Big Brothers Big Sisters Impact Study"
    }
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Section Title */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-wider">
            Por que o Movê existe
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3">
            Os números mostram a necessidade
          </h2>
        </motion.div>

        {/* Youth Reality Block */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          variants={fadeInUp}
          className="mb-16"
        >
          <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-8 text-center">
            A realidade dos jovens no Brasil:
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {youthStats.map((stat, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                variants={fadeInUp}
                className="bg-background rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-3xl md:text-4xl font-bold text-primary">
                      {stat.number}
                    </span>
                    <p className="text-base text-muted-foreground mt-1">
                      {stat.text}
                      {stat.detail && (
                        <span className="text-sm opacity-75"> {stat.detail}</span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sources */}
          <p className="text-xs text-muted-foreground/70 mt-6 text-center">
            Fonte:{" "}
            <a
              href="https://www.gov.br/trabalho-e-emprego/pt-br/noticias-e-conteudo/2025/abril/jovens-ganham-espaco-no-mercado-de-trabalho-e-impulsionam-queda-no-desemprego-e-na-informalidade"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline hover:text-primary/70 transition-colors"
            >
              Ministério do Trabalho e Emprego
            </a>
          </p>
        </motion.div>

        {/* Divider */}
        <div className="w-24 h-px bg-border mx-auto mb-16" />

        {/* Mentorship Impact Block */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          variants={fadeInUp}
        >
          <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4 text-center">
            Por que mentoria faz diferença:
          </h3>

          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">
            Jovens com acesso a mentores desenvolvem competências, ganham clareza sobre carreira e tomam decisões mais conscientes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mentorshipStats.map((stat, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                variants={fadeInUp}
                className="bg-background rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-colors text-center"
              >
                <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="block text-4xl md:text-5xl font-bold text-primary">
                  {stat.number}
                </span>
                <p className="text-base text-muted-foreground mt-2">
                  {stat.text}
                </p>
                <a
                  href={stat.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-muted-foreground/60 mt-3 underline-offset-2 hover:underline hover:text-primary/70 transition-colors"
                >
                  {stat.sourceName}
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Closing Text */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          variants={fadeInUp}
          className="mt-16 text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-6">
            <Heart className="w-6 h-6" />
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Quando jovens encontram direcionamento, toda a sociedade ganha: redução do desemprego juvenil, melhor qualificação profissional e diminuição da desigualdade de oportunidades.
          </p>
          <p className="text-xl font-semibold text-primary mt-4">
            O Movê democratiza esse acesso.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyMoveSection;
