import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="sobre" className="pt-24 md:pt-32 pb-12 md:pb-16 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Manifesto - clean, flowing layout */}
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-black text-lg md:text-xl mb-8 tracking-widest uppercase">

            Quem somos
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.2] mb-12 text-foreground">

            Acreditamos que todo jovem merece{" "}
            <span className="text-primary">clareza e apoio</span>{" "}
            para construir sua trajetória profissional.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-8">

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              A Movê nasceu de uma inquietação real: muitos jovens não carecem de talento, 
              mas de orientação, referências e segurança para tomar decisões sobre carreira.
            </p>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">Somos um projeto social que funciona como um hub que conecta conhecimento, experiência e pessoas. Reunimos profissionais voluntários dispostos a orientar jovens em diferentes fases da vida profissional — do início ao crescimento contínuo.



            </p>
            
            <p className="text-2xl md:text-3xl font-semibold text-foreground leading-snug">
              De forma gratuita, acessível e transparente.
            </p>
          </motion.div>

          {/* Highlight phrase */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 flex items-center gap-4">

            <span className="w-12 h-[3px] bg-primary rounded-full" />
            <p className="text-xl md:text-2xl font-bold text-foreground">
              Pessoas ajudando pessoas a avançar com mais direção.
            </p>
          </motion.div>
        </div>
      </div>
    </section>);

};

export default AboutSection;