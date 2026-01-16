import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const AboutSection = () => {
  return (
    <section id="sobre" className="py-24 md:py-32 bg-secondary text-secondary-foreground overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Story */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-primary font-medium text-sm mb-4 tracking-wide">
              ✦ Nossa história
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8">
              Acreditamos que 
              <span className="text-primary"> todo mundo </span>
              merece uma chance.
            </h2>
            <div className="space-y-6 text-secondary-foreground/80 text-lg leading-relaxed">
              <p>
                O Movê nasceu de uma inquietação: por que tantas pessoas 
                talentosas ficam de fora do mercado de trabalho simplesmente 
                por não saberem como se apresentar?
              </p>
              <p>
                Reunimos mentores voluntários — profissionais de diversas 
                áreas — que dedicam seu tempo para orientar quem está 
                começando ou recomeçando. Sem custos, sem pegadinhas.
              </p>
              <p className="text-secondary-foreground font-medium">
                Apenas pessoas ajudando pessoas.
              </p>
            </div>
          </motion.div>

          {/* Right - What we offer */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {[
              {
                number: "01",
                title: "Mentorias individuais",
                description: "Conversas 1:1 com profissionais que já passaram por onde você quer chegar."
              },
              {
                number: "02", 
                title: "Conteúdos práticos",
                description: "Vídeos e materiais sobre currículo, LinkedIn, entrevistas e soft skills."
              },
              {
                number: "03",
                title: "Comunidade de apoio",
                description: "Um espaço seguro para tirar dúvidas, trocar experiências e se motivar."
              }
            ].map((item, index) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex gap-6 p-6 rounded-2xl bg-secondary-foreground/5 hover:bg-secondary-foreground/10 transition-colors"
              >
                <span className="text-primary font-bold text-2xl">{item.number}</span>
                <div>
                  <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                  <p className="text-secondary-foreground/70">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ODS Banner - minimal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 pt-12 border-t border-secondary-foreground/10"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🎯</span>
              <div>
                <p className="font-bold text-lg">ODS 4 — Educação de Qualidade</p>
                <p className="text-secondary-foreground/70 text-sm">
                  Alinhado aos Objetivos de Desenvolvimento Sustentável da ONU
                </p>
              </div>
            </div>
            <Link
              to="/voluntario"
              className="text-primary font-semibold hover:underline underline-offset-4"
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
