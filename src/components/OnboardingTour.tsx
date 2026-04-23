import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ArrowRight, ArrowLeft, Users, BookOpen, 
  MessageCircle, Sparkles, Target, Check, Trophy, Briefcase, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  navigateTo?: string;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo(a) à Movê! 🎉",
    description: "Conectamos você a mentores, conteúdos e uma comunidade para impulsionar sua carreira. Vamos fazer um tour!",
    icon: <Sparkles className="w-5 h-5" />,
    navigateTo: "/inicio",
  },
  {
    id: "mentors",
    title: "Encontre seu mentor",
    description: "Explore mentores de diversas áreas e agende sessões gratuitas de orientação profissional.",
    icon: <Users className="w-5 h-5" />,
    navigateTo: "/mentores",
  },
  {
    id: "trails",
    title: "Trilhas de aprendizado",
    description: "Roteiros guiados com conteúdos, vídeos e ações práticas para desenvolver habilidades.",
    icon: <Map className="w-5 h-5" />,
    navigateTo: "/trilhas",
  },
  {
    id: "plan",
    title: "Plano de desenvolvimento",
    description: "Crie uma estratégia personalizada de carreira com metas e prazos.",
    icon: <Briefcase className="w-5 h-5" />,
    navigateTo: "/plano",
  },
  {
    id: "achievements",
    title: "Conquistas",
    description: "Desbloqueie conquistas conforme avança na plataforma!",
    icon: <Trophy className="w-5 h-5" />,
    navigateTo: "/conquistas",
  },
  {
    id: "content",
    title: "Biblioteca de conteúdos",
    description: "Vídeos, artigos, templates e materiais exclusivos para seu desenvolvimento.",
    icon: <BookOpen className="w-5 h-5" />,
    navigateTo: "/conteudos",
  },
  {
    id: "community",
    title: "Comunidade no WhatsApp",
    description: "Troque experiências e se conecte com outros membros da comunidade Movê.",
    icon: <MessageCircle className="w-5 h-5" />,
    navigateTo: "/inicio",
  },
  {
    id: "mission",
    title: "Sua primeira missão! 🎯",
    description: "Agende sua primeira mentoria! Escolha um mentor e dê o primeiro passo.",
    icon: <Target className="w-5 h-5" />,
    navigateTo: "/inicio",
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigate to the page for the current step
  useEffect(() => {
    const step = steps[currentStep];
    if (step.navigateTo) {
      navigate(step.navigateTo);
    }
  }, [currentStep, navigate]);

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
    
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", user.id);
    }
    
    // Navigate back to dashboard
    navigate("/inicio");
    
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
    
    navigate("/inicio");
    
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
          className="fixed bottom-0 sm:bottom-4 left-0 sm:left-1/2 sm:-translate-x-1/2 right-0 sm:right-auto z-50 flex items-center justify-center sm:p-4 pointer-events-none"
        >
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="pointer-events-auto w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
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

            {/* Content — compact layout */}
            <div className="p-4 pt-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground text-sm leading-tight">{step.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{step.description}</p>
                  </div>
                  {/* Close */}
                  <button
                    onClick={handleSkip}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="rounded-lg text-xs h-8"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "w-4 bg-primary"
                          : index < currentStep
                          ? "w-1.5 bg-primary/50"
                          : "w-1.5 bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  size="sm"
                  className="rounded-lg bg-gradient-hero text-primary-foreground shadow-sm hover:opacity-90 text-xs h-8"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Concluir
                    </>
                  ) : (
                    <>
                      Próximo
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
