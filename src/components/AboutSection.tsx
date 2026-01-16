import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const AboutSection = () => {
  return (
    <section id="sobre" className="py-24 md:py-32 bg-secondary text-secondary-foreground overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Manifesto */}
        <div className="max-w-4xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-primary font-medium text-sm mb-6 tracking-wide uppercase">
              Quem somos
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8">
              Acreditamos que todo jovem merece 
              <span className="text-primary"> clareza, apoio e acesso </span>
              para construir sua carreira.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6 text-lg md:text-xl leading-relaxed text-secondary-foreground/80"
          >
            <p>
              O Movê nasce da realidade de milhares de jovens que querem trabalhar, 
              crescer e evoluir, mas não sabem por onde começar, que caminhos existem 
              ou se estão fazendo as escolhas certas.
            </p>
            <p className="text-secondary-foreground font-semibold text-xl md:text-2xl">
              Mais do que falta de oportunidades, existe falta de orientação.
            </p>
            <p>
              Por isso, o Movê é um <strong>hub de orientação profissional</strong> que 
              conecta jovens a profissionais voluntários, conteúdos práticos e uma 
              comunidade ativa — tudo para ajudar a transformar dúvidas em direção 
              e intenção em ação.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 p-8 bg-primary/10 rounded-2xl border border-primary/20"
          >
            <p className="text-xl md:text-2xl font-bold text-foreground mb-2">
              Aqui, ninguém caminha sozinho.
            </p>
            <p className="text-secondary-foreground/80 text-lg">
              Pessoas ajudando pessoas a dar o próximo passo, com consciência e propósito.
            </p>
          </motion.div>
        </div>

        {/* O que é o Movê - HUB structure */}
        <div className="mb-24">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-medium text-sm mb-8 tracking-wide uppercase text-center"
          >
            O que é o Movê
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Orientação profissional",
                description: "Conversas e mentorias com profissionais que já viveram desafios reais de carreira e podem ajudar a enxergar caminhos possíveis, decisões estratégicas e próximos passos concretos."
              },
              {
                number: "02", 
                title: "Conteúdos práticos e aplicáveis",
                description: "Materiais diretos sobre carreira, escolhas profissionais, currículo, LinkedIn, entrevistas, soft skills e vida profissional — sem romantização e sem discurso vazio."
              },
              {
                number: "03",
                title: "Comunidade de apoio",
                description: "Um espaço seguro para trocar experiências, compartilhar dúvidas, aprender com histórias reais e construir rede desde o início da jornada profissional."
              }
            ].map((item, index) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="p-8 rounded-2xl bg-background/50 border border-border hover:border-primary/30 transition-colors"
              >
                <span className="text-primary font-bold text-4xl mb-4 block">{item.number}</span>
                <h3 className="font-bold text-xl mb-4 text-foreground">{item.title}</h3>
                <p className="text-secondary-foreground/70 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ODS Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="pt-12 border-t border-secondary-foreground/10"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="text-4xl">🎯</span>
              <div>
                <p className="font-bold text-lg text-foreground">ODS 4 — Educação de Qualidade</p>
                <p className="text-secondary-foreground/70 text-sm max-w-md">
                  Acreditamos que orientação e acesso ao conhecimento são ferramentas 
                  essenciais para inclusão produtiva e mobilidade social.
                </p>
              </div>
            </div>
            <Link
              to="/voluntario"
              className="text-primary font-semibold hover:underline underline-offset-4 whitespace-nowrap"
            >
              Quero ser voluntário →
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
