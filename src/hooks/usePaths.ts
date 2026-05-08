import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrailProgress {
  trilha_id: string;
  progresso_percentual: number;
  concluido_em: string | null;
  completed_steps: number;
  total_steps: number;
  titulo: string;
  icone: string;
}

export const usePathsList = () => {
  const { user } = useAuth();
  const [trails, setTrails] = useState<TrailProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchActiveTrails();
  }, [user]);

  const fetchActiveTrails = async () => {
    if (!user) return;

    const { data: progressData } = await supabase
      .from("progresso_trilha")
      .select("*, trilhas(titulo, icone)")
      .eq("mentorado_id", user.id)
      .is("concluido_em", null)
      .order("updated_at", { ascending: false })
      .limit(2);

    if (progressData && progressData.length > 0) {
      const trilhaIds = progressData.map((p) => p.trilha_id);

      const { data: steps } = await supabase
        .from("passos_trilha")
        .select("trilha_id")
        .in("trilha_id", trilhaIds);

      const { data: completedSteps } = await supabase
        .from("progresso_passo")
        .select("passo_id, passos_trilha(trilha_id)")
        .eq("mentorado_id", user.id)
        .eq("completado", true);

      const stepCounts: Record<string, number> = {};
      steps?.forEach((s) => {
        stepCounts[s.trilha_id] = (stepCounts[s.trilha_id] || 0) + 1;
      });

      const completedCounts: Record<string, number> = {};
      completedSteps?.forEach((cs: any) => {
        const tid = cs.passos_trilha?.trilha_id;
        if (tid) completedCounts[tid] = (completedCounts[tid] || 0) + 1;
      });

      setTrails(
        progressData.map((p) => ({
          trilha_id: p.trilha_id,
          progresso_percentual: p.progresso_percentual,
          concluido_em: p.concluido_em,
          completed_steps: completedCounts[p.trilha_id] || 0,
          total_steps: stepCounts[p.trilha_id] || 0,
          titulo: (p as any).trilhas?.titulo || "Trilha",
          icone: (p as any).trilhas?.icone || "🎯",
        }))
      );
    }

    setLoading(false);
  };

  return { trails, loading, refresh: fetchActiveTrails };
};

/** Returns active trail progress (alias matching issue spec naming) */
export const useMyPathProgress = usePathsList;
