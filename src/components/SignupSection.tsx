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
            Pronto pra dar o
            <span className="text-gradient"> próximo passo</span>?
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-xl mx-auto">
            Cadastre-se gratuitamente e comece sua jornada. 
            Estamos aqui pra te ajudar a conquistar seu espaço.
          </p>
          <Link
            to="/auth"
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
                Eu preciso pagar para ter acesso?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6">
                Não! O Movê é um projeto social 100% gratuito, criado para auxiliar você na sua jornada profissional. Sem custos escondidos, sem pegadinhas.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border border-border rounded-2xl px-6 data-[state=open]:bg-accent/30">
              <AccordionTrigger className="text-left text-foreground font-semibold text-lg hover:no-underline py-6">
                Como funcionam as mentorias?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6">
                Após criar sua conta, você terá acesso à nossa lista de mentores voluntários. Escolha alguém da área que te interessa e agende uma conversa online. Simples assim!
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border border-border rounded-2xl px-6 data-[state=open]:bg-accent/30">
              <AccordionTrigger className="text-left text-foreground font-semibold text-lg hover:no-underline py-6">
                Quem pode participar?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6">
                Todo mundo! Se você está buscando emprego, quer fazer transição de carreira ou simplesmente quer se desenvolver profissionalmente, o Movê é pra você.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border border-border rounded-2xl px-6 data-[state=open]:bg-accent/30">
              <AccordionTrigger className="text-left text-foreground font-semibold text-lg hover:no-underline py-6">
                Posso ser mentor voluntário?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base pb-6">
                Claro! Se você tem experiência profissional e quer compartilhar conhecimento, adoraríamos ter você no time. Acesse a página "Seja Voluntário" e se inscreva.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default SignupSection;
