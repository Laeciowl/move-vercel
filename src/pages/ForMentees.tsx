import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, GraduationCap, Target, Users, Calendar, BookOpen, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ForMentees = () => {
  const navigate = useNavigate();

  const targetAudience = [
    "Jovens entre 18 e 30 anos (classificação ONU para juventude)",
    "Estudantes universitários buscando direcionamento",
    "Recém-formados em busca do primeiro emprego",
    "Profissionais em início de carreira querendo evoluir",
    "Estagiários que querem se preparar para o mercado",
    "Jovens em transição de carreira",
  ];

  const whatWeExpect = [
    {
      title: "Comprometimento",
      description: "Compareça às mentorias agendadas e avise com antecedência caso precise remarcar",
    },
    {
      title: "Abertura para aprender",
      description: "Esteja disposto a ouvir, refletir e colocar em prática os aprendizados",
    },
    {
      title: "Respeito",
      description: "Valorize o tempo e a dedicação dos mentores voluntários",
    },
    {
      title: "Proatividade",
      description: "Traga suas dúvidas, desafios e objetivos claros para as sessões",
    },
  ];

  const benefits = [
    {
      icon: Users,
      title: "Mentoria 1:1",
      description: "Sessões individuais com profissionais experientes de diversas áreas",
    },
    {
      icon: BookOpen,
      title: "Conteúdos exclusivos",
      description: "Acesso a materiais, templates e recursos para sua evolução profissional",
    },
    {
      icon: Calendar,
      title: "Flexibilidade",
      description: "Agende sessões nos horários que funcionam para você",
    },
    {
      icon: Target,
      title: "Orientação personalizada",
      description: "Receba conselhos adaptados aos seus objetivos e momento de carreira",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Voltar ao início
            </motion.button>

            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6"
              >
                <GraduationCap className="w-5 h-5" />
                <span className="font-semibold">Para Mentorados</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
              >
                A mentoria é pra mim?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted-foreground mb-8 max-w-2xl"
              >
                A Movê é uma plataforma gratuita de orientação profissional para jovens que estão construindo suas carreiras. Se você se identifica com nosso público, bora lá!
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => navigate("/auth?cadastro=true")}
                className="group inline-flex items-center gap-2 bg-gradient-hero text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-button hover:scale-105 transition-transform"
              >
                Inscreva-se gratuitamente
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Para quem é a Movê?
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                Nosso foco são jovens profissionais em diferentes momentos da jornada:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {targetAudience.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border"
                  >
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                O que você encontra aqui
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Recursos gratuitos para impulsionar sua carreira
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border text-center"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What We Expect */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                O que esperamos de você
              </h2>
              <p className="text-lg text-muted-foreground mb-10">
                Para que a experiência seja positiva para todos, contamos com seu comprometimento:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {whatWeExpect.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-2xl p-6"
                  >
                    <h3 className="font-bold text-xl text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-hero text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para dar o próximo passo?
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Crie sua conta gratuitamente e comece a agendar suas mentorias hoje mesmo.
              </p>
              <button
                onClick={() => navigate("/auth?cadastro=true")}
                className="group inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
              >
                Criar minha conta grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForMentees;
