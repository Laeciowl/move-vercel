import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ArrowRight, ArrowLeft, Users, BookOpen, 
  RefreshCw, MessageCircle, Sparkles, Target, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo(a) ao Movê! 🎉",
    description: "O Movê conecta você a mentores incríveis e recursos para impulsionar sua carreira. Vamos fazer um tour rápido pela plataforma!",
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: "mentors",
    title: "Encontre seu mentor",
    description: "Na seção de Mentoria, você pode explorar mentores de diversas áreas e agendar sessões gratuitas de orientação profissional.",
    icon: <Users className="w-8 h-8" />,
    highlight: "mentorship-section",
  },
  {
    id: "content",
    title: "Biblioteca de conteúdos",
    description: "Acesse vídeos, artigos e materiais exclusivos criados por voluntários para ajudar no seu desenvolvimento.",
    icon: <BookOpen className="w-8 h-8" />,
    highlight: "content-library",
  },
  {
    id: "guide",
    title: "Guia da Plataforma 📖",
    description: "No seu dashboard, você encontrará o 'Guia de como aproveitar a plataforma' com dicas detalhadas e passo a passo para tirar o máximo proveito do Movê!",
    icon: <BookOpen className="w-8 h-8" />,
  },
  {
    id: "evolution",
    title: "Acompanhe sua evolução",
    description: "Atualize seu status profissional e veja seu histórico de progresso. Isso nos ajuda a entender o impacto do Movê!",
    icon: <RefreshCw className="w-8 h-8" />,
  },
  {
    id: "community",
    title: "Comunidade no WhatsApp",
    description: "Entre no nosso grupo para trocar experiências, tirar dúvidas e se conectar com outros membros da comunidade.",
    icon: <MessageCircle className="w-8 h-8" />,
  },
  {
    id: "mission",
    title: "Sua primeira missão! 🎯",
    description: "Agora que você conhece a plataforma, sua missão é agendar sua primeira mentoria! Escolha um mentor e dê o primeiro passo na sua jornada.",
    icon: <Target className="w-8 h-8" />,
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const { user } = useAuth();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsExiting(true);
    
    // Mark onboarding as completed in database
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);
    }
    
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = async () => {
    setIsExiting(true);
    
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);
    }
    
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/95 backdrop-blur-md"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
          >
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
              <motion.div
                className="h-full bg-gradient-hero"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-8 pt-10">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-1.5 mb-6">
                {steps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? "w-6 bg-primary"
                        : index < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-hero text-primary-foreground mb-6 shadow-button">
                    {step.icon}
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    {step.title}
                  </h2>

                  <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {step.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>

                <span className="text-sm text-muted-foreground">
                  {currentStep + 1} de {steps.length}
                </span>

                <Button
                  onClick={handleNext}
                  className="rounded-xl bg-gradient-hero text-primary-foreground shadow-button hover:opacity-90"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Começar!
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Skip link */}
              <div className="text-center mt-4">
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Pular tour
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
