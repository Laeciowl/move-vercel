import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PathCardsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Qual é o seu caminho?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha como você quer fazer parte do Movê
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Mentee Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            onClick={() => navigate("/para-mentorados")}
            className="group cursor-pointer"
          >
            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 hover:border-primary/40 rounded-3xl p-8 md:p-10 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 overflow-hidden">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-6 shadow-button">
                  <GraduationCap className="w-8 h-8 text-primary-foreground" />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Quero ser mentorado
                </h3>
                
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  A mentoria é pra mim? Descubra como o Movê pode ajudar você a dar os próximos passos na sua carreira.
                </p>
                
                <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                  Saiba mais
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mentor Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            onClick={() => navigate("/para-mentores")}
            className="group cursor-pointer"
          >
            <div className="relative bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border-2 border-orange-500/20 hover:border-orange-500/40 rounded-3xl p-8 md:p-10 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 overflow-hidden">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-button">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Quero ser mentor voluntário
                </h3>
                
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Seu conhecimento pode transformar vidas. Descubra como impactar jovens profissionais como mentor voluntário.
                </p>
                
                <div className="flex items-center gap-2 text-orange-500 font-semibold group-hover:gap-4 transition-all">
                  Saiba mais
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PathCardsSection;
