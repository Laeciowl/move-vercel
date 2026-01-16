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
    <section id="inscreva-se" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Comece agora
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-6">
            Transforme seu futuro profissional
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Cadastre-se gratuitamente e tenha acesso a mentorias, conteúdos exclusivos 
            e uma comunidade que vai impulsionar sua carreira.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-gradient-hero text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg shadow-button hover:opacity-90 transition-opacity"
          >
            Inscreva-se gratuitamente
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-foreground text-center mb-8">
            Perguntas frequentes
          </h3>
          <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-border">
                <AccordionTrigger className="text-left text-foreground font-semibold hover:no-underline">
                  Eu preciso pagar para ter acesso?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Não, o Movê é um projeto social sem custos, desenhado para auxiliar você na sua jornada profissional.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-border">
                <AccordionTrigger className="text-left text-foreground font-semibold hover:no-underline">
                  Como funciona a mentoria?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Após se cadastrar, você terá acesso à nossa lista de mentores voluntários. Basta escolher um profissional da área que te interessa e agendar uma sessão online.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-border">
                <AccordionTrigger className="text-left text-foreground font-semibold hover:no-underline">
                  Quem pode participar?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  O Movê é aberto a todos que buscam desenvolvimento profissional, especialmente jovens em início de carreira ou em transição profissional.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SignupSection;
