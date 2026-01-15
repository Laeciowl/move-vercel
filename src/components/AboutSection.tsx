import { motion } from "framer-motion";
import { BookOpen, Users, Briefcase, Heart } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Educação de Qualidade",
    description: "Cursos e workshops focados nas habilidades mais demandadas pelo mercado.",
  },
  {
    icon: Users,
    title: "Mentoria Personalizada",
    description: "Acompanhamento individual com profissionais experientes do mercado.",
  },
  {
    icon: Briefcase,
    title: "Conexão com Empresas",
    description: "Parcerias com empresas que valorizam talentos em desenvolvimento.",
  },
  {
    icon: Heart,
    title: "Apoio Integral",
    description: "Suporte emocional e desenvolvimento de soft skills essenciais.",
  },
];

const AboutSection = () => {
  return (
    <section id="sobre" className="py-24 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Sobre o Projeto
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-6">
            Movimentando vidas através da educação
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            O Movê nasceu da crença de que todo jovem merece uma chance justa no mercado de trabalho.
            Oferecemos capacitação profissional gratuita, conectando educação à empregabilidade
            e transformando potencial em oportunidade.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card p-8 rounded-2xl shadow-card hover:shadow-lg transition-shadow group"
            >
              <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-secondary rounded-3xl p-8 md:p-12 text-center"
        >
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <p className="text-4xl md:text-5xl font-extrabold text-primary">500+</p>
              <p className="text-secondary-foreground/80 mt-2">Jovens impactados</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-extrabold text-primary">85%</p>
              <p className="text-secondary-foreground/80 mt-2">Taxa de empregabilidade</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-extrabold text-primary">30+</p>
              <p className="text-secondary-foreground/80 mt-2">Empresas parceiras</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
