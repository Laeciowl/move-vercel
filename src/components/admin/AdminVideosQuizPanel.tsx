import { useState, useEffect } from "react";
import { Video, Plus, Trash2, Loader2, Save, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PlatformVideo {
  id: string;
  key: string;
  youtube_url: string;
  title: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_option_index: number;
  sort_order: number;
  active: boolean;
}

const AdminVideosQuizPanel = () => {
  const [videos, setVideos] = useState<PlatformVideo[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_option_index: 0,
  });
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [videosRes, questionsRes] = await Promise.all([
      supabase.from("platform_videos").select("*"),
      supabase.from("onboarding_questions").select("*").order("sort_order"),
    ]);
    if (videosRes.data) setVideos(videosRes.data);
    if (questionsRes.data) {
      setQuestions(questionsRes.data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options as string[] : [],
      })));
    }
    setLoading(false);
  };

  const handleVideoSave = async (key: string, youtube_url: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_videos")
      .update({ youtube_url, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Vídeo atualizado!");
    setSaving(false);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim() || newQuestion.options.some(o => !o.trim())) {
      toast.error("Preencha a pergunta e todas as opções");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("onboarding_questions").insert({
      question: newQuestion.question,
      options: newQuestion.options,
      correct_option_index: newQuestion.correct_option_index,
      sort_order: questions.length,
    });
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Pergunta adicionada!");
      setNewQuestion({ question: "", options: ["", "", "", ""], correct_option_index: 0 });
      setShowAddQuestion(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from("onboarding_questions").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Pergunta removida");
      fetchData();
    }
  };

  const handleToggleQuestion = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("onboarding_questions")
      .update({ active })
      .eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const heroVideo = videos.find(v => v.key === "hero_video");
  const onboardingVideo = videos.find(v => v.key === "onboarding_video");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <Video className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Vídeos & Questionário</h3>
      </div>

      {/* Video URLs */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground">🎬 Vídeos da Plataforma</h4>
        
        {heroVideo && (
          <VideoEditor
            label="Vídeo da Landing Page (Hero)"
            video={heroVideo}
            onSave={handleVideoSave}
            saving={saving}
          />
        )}
        
        {onboardingVideo && (
          <VideoEditor
            label="Vídeo de Onboarding (Questionário)"
            video={onboardingVideo}
            onSave={handleVideoSave}
            saving={saving}
          />
        )}
      </div>

      {/* Quiz Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-foreground">📝 Perguntas do Questionário de Onboarding</h4>
          <Button size="sm" onClick={() => setShowAddQuestion(!showAddQuestion)} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Nova Pergunta
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Mentorados precisam acertar 80% das perguntas ativas para acessar a plataforma. 
          Máximo de 3 tentativas, com cooldown de 24h após esgotar.
        </p>

        {showAddQuestion && (
          <div className="bg-muted/30 border border-border/50 rounded-xl p-4 space-y-3">
            <Label className="text-sm font-medium">Nova pergunta</Label>
            <Textarea
              value={newQuestion.question}
              onChange={e => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Digite a pergunta..."
              className="resize-none"
            />
            <Label className="text-sm font-medium">Opções (marque a correta)</Label>
            {newQuestion.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={newQuestion.correct_option_index === i}
                  onChange={() => setNewQuestion(prev => ({ ...prev, correct_option_index: i }))}
                  className="accent-primary"
                />
                <Input
                  value={opt}
                  onChange={e => {
                    const opts = [...newQuestion.options];
                    opts[i] = e.target.value;
                    setNewQuestion(prev => ({ ...prev, options: opts }));
                  }}
                  placeholder={`Opção ${i + 1}`}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddQuestion} disabled={saving} className="rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Salvar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddQuestion(false)} className="rounded-xl">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma pergunta cadastrada. Adicione pelo menos 5 perguntas.
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground mt-1 shrink-0">{idx + 1}.</span>
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={q.active}
                      onCheckedChange={(val) => handleToggleQuestion(q.id, val)}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-5">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`text-xs px-2 py-1 rounded-lg ${
                        i === q.correct_option_index
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {i === q.correct_option_index && "✅ "}{opt}
                    </div>
                  ))}
                </div>
                {!q.active && (
                  <p className="text-xs text-muted-foreground pl-5 italic">Desativada</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Atenção:</strong> {questions.filter(q => q.active).length} pergunta(s) ativa(s). 
            Recomendado: mínimo 5 perguntas ativas para o questionário funcionar corretamente.
          </p>
        </div>
      </div>
    </div>
  );
};

// Sub-component for video URL editing
const VideoEditor = ({
  label,
  video,
  onSave,
  saving,
}: {
  label: string;
  video: PlatformVideo;
  onSave: (key: string, url: string) => void;
  saving: boolean;
}) => {
  const [url, setUrl] = useState(video.youtube_url);
  const changed = url !== video.youtube_url;

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/embed/..."
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={() => onSave(video.key, url)}
          disabled={saving || !changed}
          className="rounded-xl"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>
      {url && url.includes("youtube") && (
        <div className="aspect-video max-w-xs rounded-lg overflow-hidden border border-border/30">
          <iframe src={url} className="w-full h-full" title={label} />
        </div>
      )}
    </div>
  );
};

export default AdminVideosQuizPanel;
