import { motion } from "framer-motion";
import { ArrowRight, Heart, Users, Clock, Sparkles, ArrowLeft, CheckCircle, Target, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ForMentors = () => {
  const navigate = useNavigate();

  const whyBecome = [
    {
      icon: Heart,
      title: "Impacte vidas",
      description: "Seu conhecimento pode transformar a trajetória de jovens que precisam de orientação",
    },
    {
      icon: Users,
      title: "Compartilhe experiência",
      description: "Transmita os aprendizados da sua jornada profissional para quem está começando",
    },
    {
      icon: Lightbulb,
      title: "Desenvolva liderança",
      description: "Mentoria desenvolve habilidades de comunicação, empatia e liderança",
    },
    {
      icon: Sparkles,
      title: "Retribua à comunidade",
      description: "Faça parte de um movimento de impacto social através da educação",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Inscreva-se",
      description: "Preencha o formulário de inscrição com suas informações e área de expertise",
    },
    {
      step: "2",
      title: "Aprovação",
      description: "Nossa equipe analisa seu perfil e você recebe a confirmação por e-mail",
    },
    {
      step: "3",
      title: "Configure sua agenda",
      description: "Defina os horários em que você tem disponibilidade para mentorias",
    },
    {
      step: "4",
      title: "Comece a mentorar",
      description: "Mentorados agendam sessões com você e você transforma vidas!",
    },
  ];

  const expectations = [
    "Disponibilidade de pelo menos 2 horas por mês para sessões",
    "Comprometimento em comparecer às mentorias agendadas",
    "Respeito e acolhimento com os mentorados",
    "Compartilhar conhecimento de forma prática e acessível",
    "Dar feedbacks construtivos para evolução dos jovens",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-orange-500/5 to-transparent">
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
                className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full mb-6"
              >
                <Heart className="w-5 h-5" />
                <span className="font-semibold">Para Mentores</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
              >
                Seu objetivo é impactar vidas
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted-foreground mb-8 max-w-2xl"
              >
                Como mentor voluntário no Movê, você tem a oportunidade de compartilhar sua experiência profissional e ajudar jovens a construírem carreiras de sucesso. Seu conhecimento pode mudar trajetórias.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => navigate("/voluntario")}
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-button hover:scale-105 transition-transform"
              >
                <Heart className="w-5 h-5" />
                Quero ser mentor voluntário
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </div>
        </section>

        {/* Why become a mentor */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Por que ser mentor no Movê?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Mentoria é uma via de mão dupla: você impacta e também aprende
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {whyBecome.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border text-center"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Como funciona?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                É simples começar a impactar vidas
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {howItWorks.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-card rounded-2xl p-6 border border-border h-full">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white font-bold mb-4">
                      {item.step}
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
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
                Para garantir uma experiência positiva para os mentorados:
              </p>

              <div className="space-y-4">
                {expectations.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border"
                  >
                    <CheckCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Time commitment */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Quanto tempo preciso dedicar?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Você define sua disponibilidade! Recomendamos um mínimo de <strong className="text-foreground">2 horas por mês</strong> para sessões de mentoria. As sessões podem ter duração de 30, 45 ou 60 minutos, e você escolhe os dias e horários que funcionam para sua rotina.
              </p>
              <p className="text-muted-foreground">
                A flexibilidade é nossa: você está no controle da sua agenda.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pronto para transformar vidas?
              </h2>
              <p className="text-lg opacity-90 mb-8">
                Junte-se à nossa comunidade de mentores voluntários e faça a diferença na carreira de jovens profissionais.
              </p>
              <button
                onClick={() => navigate("/voluntario")}
                className="group inline-flex items-center gap-2 bg-white text-orange-500 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
              >
                <Heart className="w-5 h-5" />
                Quero ser mentor voluntário
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

export default ForMentors;
