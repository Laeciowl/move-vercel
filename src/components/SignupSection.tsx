import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SignupSection = () => {
  return (
    <section id="inscreva-se" className="pt-8 pb-16 md:pt-10 md:pb-20 bg-background">
      <div className="container mx-auto px-4">
        {/* CTA Section - More impactful */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
            E aí, bora
            <span className="text-gradient"> dar o próximo passo</span>?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Se cadastrar é grátis e leva menos de 2 minutos. 
            A gente tá aqui pra te apoiar nessa jornada.
          </p>
          <Link
            to="/cadastro"
            className="inline-flex items-center gap-3 bg-gradient-hero text-primary-foreground px-10 py-5 rounded-full font-bold text-lg shadow-button hover:scale-105 transition-transform"
          >
            Criar minha conta grátis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* FAQ Section - Clean, minimal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-primary font-medium text-sm mb-4 tracking-wide text-center">
            ✦ Dúvidas frequentes
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Respondemos pra você
          </h3>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="border border-border rounded-2xl px-6 data-[state=open]:bg-accent/30">
              <AccordionTrigger className="text-left text-foreground font-semibold text-lg hover:no-underline py-6">
                Eu preciso pagar pra usar?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6">
                Não! O Movê é 100% gratuito. A gente existe pra te ajudar, não pra cobrar. 
                Sem taxas escondidas, sem surpresas — só educação de qualidade, de graça.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border border-border rounded-2xl px-6 data-[state=open]:bg-accent/30">
              <AccordionTrigger className="text-left text-foreground font-semibold text-lg hover:no-underline py-6">
                Como funciona a mentoria?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6">
                Super simples! Depois de criar sua conta, você vê a lista de mentores e escolhe 
                alguém da área que te interessa. Aí é só agendar uma conversa online. 
                Nada complicado, prometemos.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border border-border rounded-2xl px-6 data-[state=open]:bg-accent/30">
              <AccordionTrigger className="text-left text-foreground font-semibold text-lg hover:no-underline py-6">
                É pra mim?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6">
                Se você quer evoluir na carreira, sim! Seja você estudante, desempregado, 
                fazendo transição de área ou só querendo crescer — o Movê foi feito pra te apoiar.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-2xl px-6 data-[state=open]:bg-accent/30">
              <AccordionTrigger className="text-left text-foreground font-semibold text-lg hover:no-underline py-6">
                Posso ser voluntário também?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6">
                Pode sim, e a gente ia amar! Se você tem experiência profissional e quer 
                compartilhar o que aprendeu, clica em "Seja Voluntário" e vem fazer parte do time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default SignupSection;
