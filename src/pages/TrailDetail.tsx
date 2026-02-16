import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, Clock, Lock, BookOpen, Download, Video,
  PenLine, MessageSquare, ExternalLink, Loader2, Target, PartyPopper
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Trail {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  duracao_estimada_minutos: number;
}

interface Step {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  link_externo: string | null;
  tags_mentor_requeridas: string[] | null;
  ordem: number;
}

interface StepProgress {
  passo_id: string;
  completado: boolean;
  completado_em: string | null;
  completado_automaticamente: boolean;
}

const stepTypeIcons: Record<string, any> = {
  conteudo: BookOpen,
  download: Download,
  video: Video,
  acao: PenLine,
  mentoria: MessageSquare,
};

const stepTypeLabels: Record<string, string> = {
  conteudo: "Conteúdo",
  download: "Download",
  video: "Vídeo",
  acao: "Ação",
  mentoria: "Mentoria",
};

const TrailDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepProgress, setStepProgress] = useState<Record<string, StepProgress>>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    fetchData();
  }, [user, id]);

  const fetchData = async () => {
    if (!id || !user) return;

    const [{ data: trailData }, { data: stepsData }] = await Promise.all([
      supabase.from("trilhas").select("*").eq("id", id).maybeSingle(),
      supabase.from("passos_trilha").select("*").eq("trilha_id", id).order("ordem"),
    ]);

    if (trailData) setTrail(trailData);
    if (stepsData) setSteps(stepsData as Step[]);

    // Fetch step progress
    const { data: progressData } = await supabase
      .from("progresso_passo")
      .select("*")
      .eq("mentorado_id", user.id)
      .in("passo_id", stepsData?.map(s => s.id) || []);

    const progressMap: Record<string, StepProgress> = {};
    progressData?.forEach(p => {
      progressMap[p.passo_id] = p;
    });
    setStepProgress(progressMap);

    // Check disclaimer
    const disclaimerKey = `trail_disclaimer_seen_${user.id}`;
    if (!localStorage.getItem(disclaimerKey)) {
      setShowDisclaimer(true);
    }

    // Ensure trail progress exists
    const { data: existingProgress } = await supabase
      .from("progresso_trilha")
      .select("id")
      .eq("mentorado_id", user.id)
      .eq("trilha_id", id)
      .maybeSingle();

    if (!existingProgress) {
      await supabase.from("progresso_trilha").insert({
        mentorado_id: user.id,
        trilha_id: id,
        progresso_percentual: 0,
      });
    }

    setLoading(false);
  };

  const dismissDisclaimer = () => {
    if (user) {
      localStorage.setItem(`trail_disclaimer_seen_${user.id}`, "true");
    }
    setShowDisclaimer(false);
  };

  const getStepState = (step: Step, index: number): "completed" | "current" | "locked" => {
    if (stepProgress[step.id]?.completado) return "completed";
    if (index === 0) return "current";
    // Check if previous step is completed
    const prevStep = steps[index - 1];
    if (prevStep && stepProgress[prevStep.id]?.completado) return "current";
    return "locked";
  };

  const handleCompleteStep = async (stepId: string) => {
    if (!user || !id) return;
    setCompleting(stepId);

    const { error } = await supabase.from("progresso_passo").upsert({
      mentorado_id: user.id,
      passo_id: stepId,
      completado: true,
      completado_em: new Date().toISOString(),
      completado_automaticamente: false,
    }, { onConflict: "mentorado_id,passo_id" });

    if (error) {
      toast.error("Erro ao marcar passo: " + error.message);
      setCompleting(null);
      return;
    }

    // Recalculate progress
    const completedCount = Object.values(stepProgress).filter(p => p.completado).length + 1;
    const totalSteps = steps.length;
    const percentage = Math.round((completedCount / totalSteps) * 100);

    const updateData: any = { progresso_percentual: percentage };
    if (completedCount >= totalSteps) {
      updateData.concluido_em = new Date().toISOString();
    }

    await supabase.from("progresso_trilha")
      .update(updateData)
      .eq("mentorado_id", user.id)
      .eq("trilha_id", id);

    if (completedCount >= totalSteps) {
      setShowCelebration(true);
      toast.success("🎉 Parabéns! Você completou a trilha!");
    } else {
      toast.success("✅ Passo concluído!");
    }

    setCompleting(null);
    fetchData();
  };

  const completedSteps = Object.values(stepProgress).filter(p => p.completado).length;
  const progressPercentage = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!trail) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Trilha não encontrada.</p>
          <Button onClick={() => navigate("/trilhas")} className="mt-4">Voltar</Button>
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
              <p className="font-semibold text-foreground mb-2">⚠️ Você é quem controla seu progresso!</p>
              <p className="text-sm text-muted-foreground mb-1">
                As trilhas são estruturadas para te ajudar, mas seu sucesso depende de você.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Seja honesto nos checkboxes — você só engana a si mesmo.
              </p>
              <p className="text-sm font-medium text-foreground mb-4">
                💪 Vamos crescer juntos, mas com responsabilidade!
              </p>
              <Button size="sm" onClick={dismissDisclaimer}>Entendi, vamos lá!</Button>
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
            <div className="text-4xl">{trail.icone}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{trail.titulo}</h1>
              <p className="text-muted-foreground mt-1">{trail.descricao}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{Math.round(trail.duracao_estimada_minutos / 60)}h
            </span>
            <span>•</span>
            <span>{steps.length} passos</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Seu progresso</span>
              <span className="font-medium text-foreground">{completedSteps}/{steps.length} ({progressPercentage}%)</span>
            </div>
            <Progress value={progressPercentage} className="h-2.5" />
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const state = getStepState(step, index);
            const Icon = stepTypeIcons[step.tipo] || BookOpen;
            const sp = stepProgress[step.id];

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
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    state === "completed"
                      ? "bg-green-500/10 text-green-600"
                      : state === "current"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
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
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        state === "completed"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : state === "current"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {state === "completed" ? "✅" : state === "locked" ? "🔒" : "⏳"} Passo {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">{stepTypeLabels[step.tipo]}</span>
                    </div>

                    <h4 className="font-medium text-foreground mt-1">{step.titulo}</h4>
                    {step.descricao && (
                      <p className="text-sm text-muted-foreground mt-0.5">{step.descricao}</p>
                    )}

                    {state === "completed" && sp?.completado_em && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Completado em {format(new Date(sp.completado_em), "dd/MM/yyyy", { locale: ptBR })}
                        {sp.completado_automaticamente && " (auto)"}
                      </p>
                    )}

                    {state === "locked" && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Complete o passo anterior para desbloquear
                      </p>
                    )}

                    {/* Action buttons */}
                    {state === "current" && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {step.tipo === "mentoria" && (
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
                        {step.link_externo && (
                          <a href={step.link_externo} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-1.5">
                              <ExternalLink className="w-3.5 h-3.5" />
                              {step.tipo === "video" ? "Assistir" : step.tipo === "download" ? "Baixar" : "Acessar"}
                            </Button>
                          </a>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleCompleteStep(step.id)}
                          disabled={completing === step.id}
                          className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {completing === step.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          Marcar como concluído
                        </Button>
                      </div>
                    )}

                    {state === "completed" && step.link_externo && (
                      <a href={step.link_externo} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                        <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-7">
                          <ExternalLink className="w-3 h-3" />
                          {step.tipo === "video" ? "Assistir novamente" : step.tipo === "download" ? "Baixar novamente" : "Acessar novamente"}
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
                <h2 className="text-xl font-bold text-foreground mb-2">Parabéns!</h2>
                <p className="text-muted-foreground mb-6">
                  Você completou a trilha <strong>{trail.titulo}</strong>!
                </p>
                <Button onClick={() => { setShowCelebration(false); navigate("/trilhas"); }}>
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
