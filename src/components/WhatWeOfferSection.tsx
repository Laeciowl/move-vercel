import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const WhatWeOfferSection = () => {
  return (
    <section className="py-24 md:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* O que é o Movê - minimal structure */}
        <div className="mb-10">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-black text-lg md:text-xl mb-16 tracking-widest uppercase"
          >
            O que oferecemos
          </motion.p>

          <div className="space-y-0">
            {[
              {
                number: "01",
                title: "Orientação profissional",
                description: "Conversas e direcionamento com profissionais que já viveram desafios semelhantes aos seus e podem ajudar na tomada de decisões de carreira."
              },
              {
                number: "02", 
                title: "Conteúdos práticos",
                description: "Materiais objetivos sobre carreira, currículo, LinkedIn, entrevistas, desenvolvimento profissional e soft skills."
              },
              {
                number: "03",
                title: "Comunidade de apoio",
                description: "Um ambiente seguro para trocar experiências, aprender com outros jovens e seguir evoluindo com apoio coletivo."
              }
            ].map((item, index) => (
              <motion.div
                key={item.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group grid md:grid-cols-[120px_1fr] gap-6 py-12 border-t border-border hover:bg-muted/30 -mx-6 px-6 transition-colors rounded-lg"
              >
                <span className="text-6xl md:text-7xl font-black text-primary group-hover:text-primary/80 transition-colors leading-none">
                  {item.number}
                </span>
                <div>
                  <h3 className="font-bold text-xl md:text-2xl mb-3 text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ODS Banner - subtle */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 py-8 border-t border-border"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <p className="font-semibold text-foreground">ODS 4 — Educação de Qualidade</p>
              <p className="text-muted-foreground text-sm">
                Orientação e acesso ao conhecimento como base para desenvolvimento profissional, inclusão e mobilidade social.
              </p>
            </div>
          </div>
          <Link
            to="/voluntario"
            className="group inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
          >
            Quero ser voluntário
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatWeOfferSection;
