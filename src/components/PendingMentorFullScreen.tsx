import { motion } from "framer-motion";
import { Clock, Heart, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logoMove from "@/assets/logo-move.png";

/**
 * Full-screen gate: mentor candidato (status pending) sem acesso à área logada até aprovação.
 */
const PendingMentorFullScreen = () => {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen min-h-dvh flex flex-col items-center justify-center bg-gradient-warm px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <img src={logoMove} alt="Movê" className="h-10 w-auto mx-auto mb-8" />

        <div className="relative overflow-hidden rounded-2xl bg-card border border-primary/20 shadow-card p-6 md:p-8">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                <h1 className="text-lg md:text-xl font-semibold text-foreground">
                  Sua inscrição como mentor está em análise
                </h1>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Recebemos sua candidatura e nossa equipe está avaliando seu perfil. Assim que for
                aprovado, você terá acesso às ferramentas de mentoria e poderá começar a transformar
                vidas.
              </p>
              {profile?.name && (
                <p className="text-xs text-muted-foreground/80">
                  Conta: <span className="font-medium text-foreground">{profile.name}</span>
                </p>
              )}
            </div>
          </div>

          <div className="relative mt-8 pt-6 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void signOut()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PendingMentorFullScreen;
