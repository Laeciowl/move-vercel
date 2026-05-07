import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Lock,
  BookOpen,
  Download,
  Video,
  PenLine,
  MessageSquare,
  ExternalLink,
  Loader2,
  Target,
} from "lucide-react";
import { usePath, useMyPathProgress, useCompleteStep } from "@/hooks/usePaths";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const stepTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  content: BookOpen,
  conteudo: BookOpen,
  download: Download,
  video: Video,
  action: PenLine,
  acao: PenLine,
  mentoring: MessageSquare,
  mentoria: MessageSquare,
};

const stepTypeLabels: Record<string, string> = {
  content: "Conteúdo",
  conteudo: "Conteúdo",
  download: "Download",
  video: "Vídeo",
  action: "Ação",
  acao: "Ação",
  mentoring: "Mentoria",
  mentoria: "Mentoria",
};

const getThemeFromStep = (title: string): string | null => {
  const lower = title.toLowerCase();
  if (lower.includes("currículo") || lower.includes("curriculo")) return "curriculo";
  if (lower.includes("linkedin")) return "linkedin";
  if (lower.includes("entrevista")) return "entrevistas";
  if (lower.includes("liderança") || lower.includes("lideranca")) return "lideranca";
  if (lower.includes("comunicação") || lower.includes("comunicacao")) return "comunicacao";
  if (lower.includes("programação") || lower.includes("programacao")) return "programacao";
  if (lower.includes("marketing")) return "marketing";
  if (lower.includes("dados")) return "dados";
  if (lower.includes("finanças") || lower.includes("financas")) return "financas";
  if (lower.includes("empreendedorismo")) return "empreendedorismo";
  if (lower.includes("produtividade")) return "produtividade";
  return null;
};

const TrailDetail = () => {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: pathData, isLoading: pathLoading } = usePath(id);
  const { data: progressData, isLoading: progressLoading } = useMyPathProgress();
  const completeStep = useCompleteStep(id);

  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    try {
      return !localStorage.getItem(`trail_disclaimer_seen`);
    } catch {
      return false;
    }
  });
  const [showCelebration, setShowCelebration] = useState(false);

  const loading = pathLoading || progressLoading;

  const path = pathData?.path ?? null;
  const steps = path?.steps ?? [];

  const myProgress = (progressData?.progress ?? []).find(
    (p) => p.path_id === id,
  );
  const completedStepIds = new Set(myProgress?.completed_steps ?? []);

  const completedCount = completedStepIds.size;
  const progressPercentage =
    steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const dismissDisclaimer = () => {
    try {
      localStorage.setItem("trail_disclaimer_seen", "true");
    } catch {
      // ignore
    }
    setShowDisclaimer(false);
  };

  const getStepState = (
    stepId: string,
    index: number,
  ): "completed" | "current" | "locked" => {
    if (completedStepIds.has(stepId)) return "completed";
    if (index === 0) return "current";
    const prevStep = steps[index - 1];
    if (prevStep && completedStepIds.has(prevStep.id)) return "current";
    return "locked";
  };

  const handleCompleteStep = async (stepId: string) => {
    try {
      await completeStep.mutateAsync(stepId);

      const newCompletedCount = completedCount + 1;
      if (newCompletedCount >= steps.length) {
        setShowCelebration(true);
        toast.success("Parabéns! Você completou a trilha!");
      } else {
        toast.success("Passo concluído!");
      }
    } catch {
      toast.error("Erro ao marcar passo como concluído.");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!path) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Trilha não encontrada.</p>
          <Button onClick={() => navigate("/trilhas")} className="mt-4">
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate("/trilhas")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar às trilhas
        </button>

        {/* Disclaimer */}
        <AnimatePresence>
          {showDisclaimer && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-5"
            >
              <p className="font-semibold text-foreground mb-2">
                Você é quem controla seu progresso!
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                As trilhas são estruturadas para te ajudar, mas seu sucesso
                depende de você.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Seja honesto nos checkboxes!
              </p>
              <p className="text-sm font-medium text-foreground mb-4">
                Vamos crescer juntos, mas com responsabilidade!
              </p>
              <Button size="sm" onClick={dismissDisclaimer}>
                Entendi, vamos lá!
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trail Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            {path.icon ? (
              <div className="text-4xl">{path.icon}</div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                {path.title}
              </h1>
              {path.description && (
                <p className="text-muted-foreground mt-1">{path.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {path.estimated_duration_minutes && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />~
                  {Math.round(path.estimated_duration_minutes / 60)}h
                </span>
                <span>•</span>
              </>
            )}
            <span>{steps.length} passos</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Seu progresso</span>
              <span className="font-medium text-foreground">
                {completedCount}/{steps.length} ({progressPercentage}%)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2.5" />
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const state = getStepState(step.id, index);
            const stepType = step.step_type ?? "";
            const Icon = stepTypeIcons[stepType] ?? BookOpen;
            const isCompleting =
              completeStep.isPending && completeStep.variables === step.id;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl border p-4 transition-all ${
                  state === "completed"
                    ? "bg-green-50/50 dark:bg-green-900/10 border-green-200/50 dark:border-green-700/30"
                    : state === "current"
                      ? "bg-card/50 border-primary/30"
                      : "bg-muted/20 border-border/20 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      state === "completed"
                        ? "bg-green-500/10 text-green-600"
                        : state === "current"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {state === "completed" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : state === "locked" ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          state === "completed"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : state === "current"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {state === "completed"
                          ? "Concluído"
                          : state === "locked"
                            ? "Bloqueado"
                            : "Em andamento"}{" "}
                        · Passo {index + 1}
                      </span>
                      {stepType && stepTypeLabels[stepType] && (
                        <span className="text-xs text-muted-foreground">
                          {stepTypeLabels[stepType]}
                        </span>
                      )}
                    </div>

                    <h4 className="font-medium text-foreground mt-1">
                      {step.title}
                    </h4>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    )}

                    {state === "completed" && step.completed_at && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Completado em{" "}
                        {format(new Date(step.completed_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                        {step.completed_automatically && " (auto)"}
                      </p>
                    )}

                    {state === "locked" && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Complete o passo anterior para desbloquear
                      </p>
                    )}

                    {/* Action buttons — current step */}
                    {state === "current" && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(stepType === "mentoring" || stepType === "mentoria") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate("/mentores")}
                            className="gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Agendar mentoria
                          </Button>
                        )}
                        {(stepType === "content" ||
                          stepType === "conteudo" ||
                          stepType === "video" ||
                          stepType === "download") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const tema = getThemeFromStep(step.title);
                              navigate(
                                tema ? `/conteudos?tema=${tema}` : "/conteudos",
                              );
                            }}
                            className="gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            {stepType === "video"
                              ? "Assista na página de conteúdo"
                              : stepType === "download"
                                ? "Baixe um template na página de conteúdo"
                                : "Ver conteúdos"}
                          </Button>
                        )}
                        {step.external_link && (
                          <a
                            href={step.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              {stepType === "video"
                                ? "Assistir"
                                : stepType === "download"
                                  ? "Baixar"
                                  : "Acessar"}
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleCompleteStep(step.id)}
                          disabled={isCompleting}
                          className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {isCompleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Marcar como concluído
                        </Button>
                      </div>
                    )}

                    {/* Revisit buttons — completed step */}
                    {state === "completed" &&
                      (stepType === "content" ||
                        stepType === "conteudo" ||
                        stepType === "video" ||
                        stepType === "download") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1.5 text-xs h-7 mt-2"
                          onClick={() => {
                            const tema = getThemeFromStep(step.title);
                            navigate(
                              tema ? `/conteudos?tema=${tema}` : "/conteudos",
                            );
                          }}
                        >
                          <BookOpen className="w-3 h-3" />
                          {stepType === "video"
                            ? "Assista na página de conteúdo"
                            : stepType === "download"
                              ? "Baixe na página de conteúdo"
                              : "Ver na página de conteúdo"}
                        </Button>
                      )}
                    {state === "completed" &&
                      step.external_link &&
                      stepType !== "content" &&
                      stepType !== "conteudo" &&
                      stepType !== "video" &&
                      stepType !== "download" && (
                        <a
                          href={step.external_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-2"
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-xs h-7"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Acessar novamente
                          </Button>
                        </a>
                      )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Celebration Modal */}
        <AnimatePresence>
          {showCelebration && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setShowCelebration(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed left-4 right-4 top-1/4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-sm md:w-full bg-card rounded-2xl shadow-xl z-50 p-8 text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.6 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Parabéns!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Você completou a trilha <strong>{path.title}</strong>!
                </p>
                <Button
                  onClick={() => {
                    setShowCelebration(false);
                    navigate("/trilhas");
                  }}
                >
                  Ver outras trilhas
                </Button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default TrailDetail;
