import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Heart, 
  Users, 
  BookOpen, 
  Calendar,
  Sparkles,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const steps = [
  {
    id: 1,
    icon: Heart,
    title: "Bem-vindo à equipe Movê! 💙",
    description: "Você agora faz parte de uma comunidade incrível de voluntários que transformam vidas através da educação e do acolhimento.",
    tip: "Sua aprovação está pendente. Assim que for aprovado, você terá acesso completo às funcionalidades de voluntário.",
  },
  {
    id: 2,
    icon: Users,
    title: "Mentorias Individuais",
    description: "Como mentor, você poderá oferecer sessões de mentoria 1:1 para jovens em busca de orientação profissional.",
    tip: "Configure sua disponibilidade no painel de voluntário para que os participantes possam agendar mentorias com você.",
  },
  {
    id: 3,
    icon: BookOpen,
    title: "Compartilhe Conteúdos",
    description: "Envie materiais educacionais, templates, apresentações e outros recursos que possam ajudar os participantes.",
    tip: "Acesse seu painel de voluntário para enviar conteúdos para aprovação.",
  },
  {
    id: 4,
    icon: Calendar,
    title: "Gerencie sua Agenda",
    description: "Defina os dias e horários em que você está disponível para mentorias, e bloqueie períodos quando precisar.",
    tip: "Você pode editar sua disponibilidade a qualquer momento pelo seu painel.",
  },
  {
    id: 5,
    icon: Sparkles,
    title: "Tudo Pronto!",
    description: "Você completou o onboarding! Agora é só aguardar a aprovação e começar a fazer a diferença.",
    tip: "Você receberá uma notificação quando sua candidatura for aprovada.",
  },
];

const VolunteerOnboarding = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isApproved, setIsApproved] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkVolunteerStatus = async () => {
      if (!user) return;
      
      // Check if user has volunteer role (meaning they're approved)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "voluntario")
        .maybeSingle();

      setIsApproved(!!roleData);
      setCheckingStatus(false);
    };

    checkVolunteerStatus();
  }, [user]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = () => {
    navigate("/inicio");
  };

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="bg-card rounded-3xl shadow-card p-8 md:p-10">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-2 bg-primary/60"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon className="w-10 h-10 text-primary" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {step.title}
              </h2>

              {/* Description */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {step.description}
              </p>

              {/* Tip box */}
              <div className="bg-accent/50 rounded-xl p-4 mb-8 text-left">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">💡 Dica: </span>
                  {step.tip}
                </p>
              </div>

              {/* Status badge */}
              {currentStep === 0 && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${
                  isApproved 
                    ? "bg-green-100 text-green-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {isApproved ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Aprovado como voluntário!</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Aguardando aprovação</span>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}

            {isLastStep ? (
              <Button
                onClick={finishOnboarding}
                className="flex-1 bg-gradient-hero"
              >
                <Check className="w-4 h-4 mr-2" />
                Concluir e Acessar Dashboard
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="flex-1 bg-gradient-hero"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Skip option */}
          {!isLastStep && (
            <button
              onClick={finishOnboarding}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular onboarding e ir para o dashboard
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VolunteerOnboarding;
