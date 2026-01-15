import { motion } from "framer-motion";
import { Linkedin, FileText, Globe, MessageSquare } from "lucide-react";

const features = [
  {
    icon: Linkedin,
    title: "LinkedIn Estratégico",
    description: "Aprenda a criar um perfil atrativo e fazer networking de forma eficiente.",
  },
  {
    icon: FileText,
    title: "Currículo que Destaca",
    description: "Construa um currículo profissional que chame atenção dos recrutadores.",
  },
  {
    icon: Globe,
    title: "Inglês para Negócios",
    description: "Domine o inglês essencial para o ambiente corporativo e entrevistas.",
  },
  {
    icon: MessageSquare,
    title: "Comunicação & Negócios",
    description: "Desenvolva habilidades de comunicação e visão de negócios.",
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
            Seu primeiro passo para o mercado de trabalho
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            O Movê é para você que está começando sua jornada profissional — seja jovem em busca 
            do primeiro emprego ou alguém que precisa daquele empurrãozinho para conquistar 
            sua vaga. Oferecemos capacitação gratuita e prática nas habilidades mais 
            valorizadas pelo mercado.
          </p>
          <div className="inline-flex items-center gap-3 bg-accent px-5 py-3 rounded-xl">
            <span className="text-2xl">🎯</span>
            <p className="text-sm text-accent-foreground text-left">
              <strong>ODS 4 - Educação de Qualidade:</strong> Alinhado aos Objetivos de Desenvolvimento 
              Sustentável da ONU, promovemos oportunidades de aprendizagem ao longo da vida para todos.
            </p>
          </div>
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
      </div>
    </section>
  );
};

export default AboutSection;
