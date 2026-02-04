import { motion } from "framer-motion";
import { Clock, Heart } from "lucide-react";

const PendingMentorBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border border-primary/20"
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">
                Sua inscrição como mentor está em análise
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Recebemos sua candidatura e nossa equipe está avaliando seu perfil. 
              Assim que for aprovado, você terá acesso às ferramentas de mentoria 
              e poderá começar a transformar vidas! 💙
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Enquanto isso, você pode explorar a plataforma como mentorado.
            </p>
          </div>
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </motion.div>
  );
};

export default PendingMentorBanner;
