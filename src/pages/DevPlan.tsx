import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, ChevronRight, Plus, CheckCircle, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";

type PlanGoalType = Enums<"plan_goal_type">;

const goalLabels: Record<string, string> = {
  primeiro_emprego: "Conseguir primeiro emprego/estágio",
  transicao: "Mudar de carreira",
  promocao: "Ser promovido",
  habilidades: "Melhorar habilidades",
  outro: "Outro",
};

const goalSuggestions: Record<string, { trilhas: string[]; mentorias: string[]; acoes: string[] }> = {
  primeiro_emprego: {
    trilhas: ["Currículo Matador (~2h)", "LinkedIn Estratégico (~1.5h)"],
    mentorias: ["1 mentoria com RH/Recrutamento", "1 mentoria na área desejada", "1 simulação de entrevista"],
    acoes: ["Aplicar para 5-10 vagas por semana", "Conectar com 10 pessoas no LinkedIn/semana", "Ler 2 conteúdos da biblioteca"],
  },
  transicao: {
    trilhas: ["LinkedIn Estratégico (~1.5h)"],
    mentorias: ["1 mentoria sobre transição", "2 mentorias na nova área"],
    acoes: ["Pesquisar 5 empresas da nova área", "Networking com 5 profissionais/semana", "Criar portfólio ou projetos"],
  },
  promocao: {
    trilhas: [],
    mentorias: ["1 mentoria sobre liderança", "1 mentoria com gestor da área"],
    acoes: ["Definir PDI com seu gestor", "Fazer curso de liderança", "Documentar suas entregas"],
  },
  habilidades: {
    trilhas: ["Currículo Matador (~2h)"],
    mentorias: ["1 mentoria técnica na sua área", "1 mentoria sobre desenvolvimento"],
    acoes: ["Estudar 1h por dia", "Praticar habilidades semanalmente", "Ler 3 conteúdos da biblioteca"],
  },
  outro: {
    trilhas: [],
    mentorias: ["1 mentoria para orientação"],
    acoes: ["Definir metas claras", "Buscar conteúdos relevantes"],
  },
};

interface PlanItem {
  id: string;
  tipo: string;
  descricao: string;
  completado: boolean;
  completado_em: string | null;
  ordem: number;
}

interface Plan {
  id: string;
  meta_tipo: PlanGoalType;
  meta_descricao: string;
  prazo_meses: number;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  items: PlanItem[];
}

const DevPlan = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<PlanGoalType>("primeiro_emprego");
  const [customGoal, setCustomGoal] = useState("");
  const [selectedPrazo, setSelectedPrazo] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchPlan();
  }, [user]);

  const fetchPlan = async () => {
    if (!user) return;

    const { data: planData } = await supabase
      .from("planos_desenvolvimento")
      .select("*")
      .eq("mentorado_id", user.id)
      .eq("ativo", true)
      .maybeSingle();

    if (planData) {
      const { data: items } = await supabase
        .from("plano_itens")
        .select("*")
        .eq("plano_id", planData.id)
        .order("ordem");

      setPlan({
        ...planData,
        items: (items || []) as PlanItem[],
      });
    } else {
      setShowCreate(true);
    }

    setLoading(false);
  };

  const handleCreatePlan = async () => {
    if (!user) return;
    setSaving(true);

    const dataFim = new Date();
    dataFim.setMonth(dataFim.getMonth() + selectedPrazo);

    const { data: newPlan, error: planError } = await supabase
      .from("planos_desenvolvimento")
      .insert({
        mentorado_id: user.id,
        meta_tipo: selectedGoal,
        meta_descricao: selectedGoal === "outro" ? customGoal : goalLabels[selectedGoal],
        prazo_meses: selectedPrazo,
        data_fim: dataFim.toISOString().split("T")[0],
      })
      .select()
      .single();

    if (planError || !newPlan) {
      toast.error("Erro ao criar plano: " + (planError?.message || ""));
      setSaving(false);
      return;
    }

    // Create suggested items
    const suggestions = goalSuggestions[selectedGoal] || goalSuggestions.outro;
    const items: { plano_id: string; tipo: string; descricao: string; ordem: number }[] = [];
    let order = 0;

    suggestions.trilhas.forEach(t => {
      items.push({ plano_id: newPlan.id, tipo: "trilha", descricao: t, ordem: order++ });
    });
    suggestions.mentorias.forEach(m => {
      items.push({ plano_id: newPlan.id, tipo: "mentoria", descricao: m, ordem: order++ });
    });
    suggestions.acoes.forEach(a => {
      items.push({ plano_id: newPlan.id, tipo: "acao", descricao: a, ordem: order++ });
    });

    if (items.length > 0) {
      await supabase.from("plano_itens").insert(items);
    }

    toast.success("🎯 Plano criado com sucesso!");
    setShowCreate(false);
    fetchPlan();
    setSaving(false);
  };

  const toggleItem = async (itemId: string, completed: boolean) => {
    const updateData: any = {
      completado: !completed,
      completado_em: !completed ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("plano_itens")
      .update(updateData)
      .eq("id", itemId);

    if (error) {
      toast.error("Erro ao atualizar item");
    } else {
      fetchPlan();
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Create plan view
  if (showCreate && !plan) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Target className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Criar seu Plano de Desenvolvimento</h1>
          </motion.div>

          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Qual seu objetivo principal agora?</label>
              {Object.entries(goalLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedGoal(key as PlanGoalType)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                    selectedGoal === key
                      ? "bg-primary/10 border-primary/30 text-primary font-medium"
                      : "bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {label}
                </button>
              ))}
              {selectedGoal === "outro" && (
                <input
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  placeholder="Descreva seu objetivo..."
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Em quanto tempo quer alcançar?</label>
              <select
                value={selectedPrazo}
                onChange={(e) => setSelectedPrazo(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm"
              >
                <option value={1}>1 mês</option>
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/inicio")} className="flex-1 rounded-xl">
                Cancelar
              </Button>
              <Button onClick={handleCreatePlan} disabled={saving} className="flex-1 rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar plano
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!plan) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground mb-4">Nenhum plano ativo</p>
          <Button onClick={() => setShowCreate(true)}>Criar plano</Button>
        </div>
      </AppLayout>
    );
  }

  const completedItems = plan.items.filter(i => i.completado).length;
  const totalItems = plan.items.length;
  const progressPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(plan.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                {plan.meta_descricao}
              </h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {daysLeft} dias restantes
                </span>
                <span>•</span>
                <span>Prazo: {new Date(plan.data_fim).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-foreground">{completedItems}/{totalItems} ({progressPct}%)</span>
            </div>
            <Progress value={progressPct} className="h-2.5" />
          </div>
        </motion.div>

        {/* Items by type */}
        {["trilha", "mentoria", "acao"].map(tipo => {
          const items = plan.items.filter(i => i.tipo === tipo);
          if (items.length === 0) return null;

          const typeLabels: Record<string, string> = {
            trilha: "📚 Trilhas Recomendadas",
            mentoria: "💬 Mentorias Sugeridas",
            acao: "✅ Ações Semanais",
          };

          return (
            <motion.div
              key={tipo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">{typeLabels[tipo]}</h3>
              <div className="space-y-2">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id, item.completado)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-3 transition-all ${
                      item.completado
                        ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted/20 text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 shrink-0 ${
                      item.completado ? "text-emerald-500" : "text-muted-foreground/30"
                    }`} />
                    <span className={item.completado ? "line-through opacity-70" : ""}>
                      {item.descricao}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default DevPlan;
