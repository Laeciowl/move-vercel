import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, CheckCircle2, XCircle, Loader2, Clock, Heart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import logoMove from "@/assets/logo-move.png";

const toEmbedUrl = (url: string): string => {
  if (!url) return "";
  if (url.includes("youtube.com/embed/")) return url;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = url.match(/[?&]v=([^?&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
};

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_option_index: number;
}

const MAX_ATTEMPTS = 3;
const COOLDOWN_HOURS = 24;
const PASS_THRESHOLD = 0.8;

const OnboardingQuiz = ({ onPassed }: { onPassed: () => void }) => {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"video" | "quiz" | "result" | "cooldown">("video");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [videoRes, questionsRes, attemptsRes] = await Promise.all([
      supabase.from("platform_videos").select("youtube_url").eq("key", "onboarding_video").single(),
      supabase.from("onboarding_questions").select("*").eq("active", true).order("sort_order"),
      supabase.from("onboarding_quiz_attempts").select("*").eq("user_id", user.id).order("attempted_at", { ascending: false }),
    ]);

    if (videoRes.data) setVideoUrl(videoRes.data.youtube_url);
    if (questionsRes.data) {
      setQuestions(questionsRes.data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options as string[] : [],
      })));
    }

    if (attemptsRes.data) {
      const totalAttempts = attemptsRes.data.length;
      setAttempts(totalAttempts);

      // Check if already passed
      if (attemptsRes.data.some(a => a.passed)) {
        onPassed();
        return;
      }

      // Check cooldown (3 attempts in last 24h)
      if (totalAttempts >= MAX_ATTEMPTS) {
        const lastAttempt = new Date(attemptsRes.data[0].attempted_at);
        const cooldownEnd = new Date(lastAttempt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
        if (new Date() < cooldownEnd) {
          setCooldownUntil(cooldownEnd);
          setStep("cooldown");
        } else {
          // Reset attempts count for display (past cooldown)
          setAttempts(0);
        }
      }
    }

    setLoading(false);
  };

  const handleSubmitQuiz = async () => {
    if (!user) return;
    setSubmitting(true);

    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_option_index) correct++;
    });

    const total = questions.length;
    const passed = correct / total >= PASS_THRESHOLD;

    // Save attempt
    await supabase.from("onboarding_quiz_attempts").insert({
      user_id: user.id,
      score: correct,
      total_questions: total,
      passed,
      answers,
    });

    if (passed) {
      // Mark profile as passed
      await supabase.from("profiles").update({ onboarding_quiz_passed: true }).eq("user_id", user.id);
      toast.success("Parabéns! Você passou no questionário! 🎉");
    }

    setResult({ score: correct, total, passed });
    setStep("result");
    setSubmitting(false);

    if (passed) {
      setTimeout(() => onPassed(), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    // No questions configured, let user pass
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Configurando seu acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <img src={logoMove} alt="Movê" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo ao Movê!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Antes de começar, assista o vídeo e responda o questionário
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step !== "video" ? "bg-primary" : "bg-primary/30"}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === "result" ? "bg-primary" : "bg-muted"}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === "cooldown" && cooldownUntil && (
            <motion.div
              key="cooldown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-8 text-center space-y-4"
            >
              <Clock className="w-12 h-12 text-amber-500 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Aguarde para tentar novamente</h2>
              <p className="text-muted-foreground">
                Você usou suas {MAX_ATTEMPTS} tentativas. Revise o vídeo e tente novamente após:
              </p>
              <p className="text-lg font-semibold text-primary">
                {cooldownUntil.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-left">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  💡 <strong>Dica:</strong> Reveja o vídeo com atenção, focando nos compromissos da plataforma, 
                  presença nas mentorias e respeito ao tempo dos mentores voluntários.
                </p>
              </div>
            </motion.div>
          )}

          {step === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">1. Assista o vídeo de orientação</h2>
              </div>

              {videoUrl ? (
                <div className="aspect-video rounded-xl overflow-hidden border border-border/30">
                  <iframe
                    src={toEmbedUrl(videoUrl)}
                    title="Onboarding Movê"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Vídeo ainda não configurado</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="watched"
                  checked={videoWatched}
                  onChange={e => setVideoWatched(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <label htmlFor="watched" className="text-sm text-foreground cursor-pointer">
                  Eu assisti o vídeo completo e entendi as orientações
                </label>
              </div>

              <Button
                onClick={() => setStep("quiz")}
                disabled={!videoWatched}
                className="w-full rounded-xl"
              >
                Ir para o questionário
              </Button>

              {attempts > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Tentativas usadas: {attempts}/{MAX_ATTEMPTS}
                </p>
              )}
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-6 space-y-4"
            >
              <h2 className="font-semibold text-foreground">
                2. Questionário ({currentQ + 1}/{questions.length})
              </h2>

              {/* Progress */}
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-foreground font-medium">{questions[currentQ].question}</p>
                  <div className="space-y-2">
                    {questions[currentQ].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setAnswers(prev => ({ ...prev, [questions[currentQ].id]: i }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          answers[questions[currentQ].id] === i
                            ? "border-primary bg-primary/10 text-foreground font-medium"
                            : "border-border/50 hover:border-primary/30 text-foreground"
                        }`}
                      >
                        <span className="font-medium text-muted-foreground mr-2">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-2">
                {currentQ > 0 && (
                  <Button variant="outline" onClick={() => setCurrentQ(prev => prev - 1)} className="rounded-xl">
                    Anterior
                  </Button>
                )}
                {currentQ < questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQ(prev => prev + 1)}
                    disabled={answers[questions[currentQ].id] === undefined}
                    className="flex-1 rounded-xl"
                  >
                    Próxima
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitting || Object.keys(answers).length < questions.length}
                    className="flex-1 rounded-xl"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Enviar respostas
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border/50 rounded-2xl p-8 text-center space-y-4"
            >
              {result.passed ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                  <h2 className="text-2xl font-bold text-foreground">Aprovado! 🎉</h2>
                  <p className="text-muted-foreground">
                    Você acertou {result.score}/{result.total} ({Math.round((result.score / result.total) * 100)}%).
                    Bem-vindo à comunidade Movê!
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <h2 className="text-2xl font-bold text-foreground">Não aprovado</h2>
                  <p className="text-muted-foreground">
                    Você acertou {result.score}/{result.total} ({Math.round((result.score / result.total) * 100)}%).
                    Necessário: {Math.round(PASS_THRESHOLD * 100)}%.
                  </p>
                  {attempts + 1 < MAX_ATTEMPTS ? (
                    <Button
                      onClick={() => {
                        setAnswers({});
                        setCurrentQ(0);
                        setResult(null);
                        setStep("video");
                        setVideoWatched(false);
                        setAttempts(prev => prev + 1);
                      }}
                      className="rounded-xl"
                    >
                      Tentar novamente ({MAX_ATTEMPTS - attempts - 1} tentativa(s) restante(s))
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Você usou todas as {MAX_ATTEMPTS} tentativas. Aguarde 24h para tentar novamente.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Values reminder */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Lembre-se dos valores do Movê</p>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• O Movê é um <strong>projeto social</strong> — todos os mentores são voluntários</li>
                  <li>• <strong>Respeite o tempo dos mentores</strong> — confirme presença e compareça</li>
                  <li>• Faltas sem aviso resultam em <strong>penalidades progressivas</strong></li>
                  <li>• Use a plataforma com <strong>responsabilidade e gratidão</strong></li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default OnboardingQuiz;
