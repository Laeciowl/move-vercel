import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Target, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TrailStats {
  titulo: string;
  icone: string;
  started: number;
  completed: number;
  rate: number;
}

interface NpsStats {
  total: number;
  promoters: number;
  passives: number;
  detractors: number;
  score: number;
}

const AdminTrailsNpsPanel = () => {
  const [trailStats, setTrailStats] = useState<TrailStats[]>([]);
  const [npsStats, setNpsStats] = useState<NpsStats | null>(null);
  const [capacitated, setCapacitated] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTrailDetail, setShowTrailDetail] = useState(false);
  const [showNpsDetail, setShowNpsDetail] = useState(false);
  const [npsByType, setNpsByType] = useState<{ mentors: NpsStats; mentees: NpsStats } | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<{ nota: number; feedback: string; user_type: string; created_at: string }[]>([]);

  const calcNps = (responses: { nota: number }[]): NpsStats => {
    if (responses.length === 0) return { total: 0, promoters: 0, passives: 0, detractors: 0, score: 0 };
    const promoters = responses.filter(r => r.nota >= 9).length;
    const passives = responses.filter(r => r.nota >= 7 && r.nota <= 8).length;
    const detractors = responses.filter(r => r.nota <= 6).length;
    const total = responses.length;
    const score = Math.round(((promoters - detractors) / total) * 100);
    return { total, promoters, passives, detractors, score };
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [trailsRes, progressRes, npsRes] = await Promise.all([
      supabase.from("trilhas").select("id, titulo, icone").eq("ativo", true),
      supabase.from("progresso_trilha").select("trilha_id, mentorado_id, concluido_em"),
      supabase.from("nps_respostas").select("nota, feedback, user_type, created_at").order("created_at", { ascending: false }),
    ]);

    // Trail stats
    const trails = trailsRes.data || [];
    const progress = progressRes.data || [];

    const completedUsers = new Set<string>();
    const inProgressUsers = new Set<string>();

    const stats: TrailStats[] = trails.map(t => {
      const trailProgress = progress.filter(p => p.trilha_id === t.id);
      const started = trailProgress.length;
      const completed = trailProgress.filter(p => p.concluido_em).length;
      
      trailProgress.forEach(p => {
        if (p.concluido_em) completedUsers.add(p.mentorado_id);
        else inProgressUsers.add(p.mentorado_id);
      });

      return {
        titulo: t.titulo,
        icone: t.icone,
        started,
        completed,
        rate: started > 0 ? Math.round((completed / started) * 100) : 0,
      };
    });

    setTrailStats(stats);
    setCapacitated(completedUsers.size);
    setInProgress(inProgressUsers.size);

    // NPS stats
    const npsData = npsRes.data || [];
    setNpsStats(calcNps(npsData));

    const mentorNps = npsData.filter(n => n.user_type === "mentor");
    const menteeNps = npsData.filter(n => n.user_type === "mentorado");
    setNpsByType({
      mentors: calcNps(mentorNps),
      mentees: calcNps(menteeNps),
    });

    setRecentFeedback(npsData.filter(n => n.feedback).slice(0, 10) as any);

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getNpsLabel = (score: number) => {
    if (score > 75) return { label: "Excelente", color: "text-emerald-500" };
    if (score >= 50) return { label: "Muito bom", color: "text-emerald-500" };
    if (score >= 30) return { label: "Bom", color: "text-amber-500" };
    if (score >= 0) return { label: "Regular", color: "text-amber-600" };
    return { label: "Crítico", color: "text-destructive" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trails KPI Card */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" /> Trilhas
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setShowTrailDetail(true)}>
              Detalhes
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{capacitated}</div>
            <p className="text-sm text-muted-foreground">pessoas capacitadas (≥1 trilha concluída)</p>
            <p className="text-xs text-muted-foreground mt-1">{inProgress} trilhas em andamento</p>
            {trailStats.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Taxa média: {Math.round(trailStats.reduce((acc, t) => acc + t.rate, 0) / trailStats.length)}%
              </p>
            )}
          </CardContent>
        </Card>

        {/* NPS Card */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" /> NPS
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setShowNpsDetail(true)}>
              Detalhes
            </Button>
          </CardHeader>
          <CardContent>
            {npsStats && npsStats.total > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getNpsLabel(npsStats.score).color}`}>
                    {npsStats.score}
                  </span>
                  <span className={`text-sm font-medium ${getNpsLabel(npsStats.score).color}`}>
                    {getNpsLabel(npsStats.score).label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="text-emerald-500">Promotores: {Math.round((npsStats.promoters / npsStats.total) * 100)}%</span>
                  <span>Neutros: {Math.round((npsStats.passives / npsStats.total) * 100)}%</span>
                  <span className="text-destructive">Detratores: {Math.round((npsStats.detractors / npsStats.total) * 100)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{npsStats.total} respostas</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem respostas NPS ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trails Detail Dialog */}
      <Dialog open={showTrailDetail} onOpenChange={setShowTrailDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🎯 Detalhes das Trilhas</DialogTitle>
            <DialogDescription>{capacitated} pessoas capacitadas • {inProgress} em andamento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {trailStats.map((trail, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{trail.icone} {trail.titulo}</span>
                  <span className="text-xs text-muted-foreground">{trail.rate}%</span>
                </div>
                <Progress value={trail.rate} className="h-1.5" />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Iniciaram: {trail.started}</span>
                  <span>Concluíram: {trail.completed}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* NPS Detail Dialog */}
      <Dialog open={showNpsDetail} onOpenChange={setShowNpsDetail}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>⭐ Detalhes do NPS</DialogTitle>
            <DialogDescription>
              {npsStats ? `${npsStats.total} respostas • Score: ${npsStats.score}` : "Sem dados"}
            </DialogDescription>
          </DialogHeader>
          {npsByType && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Mentorados</p>
                  <p className={`text-xl font-bold ${getNpsLabel(npsByType.mentees.score).color}`}>
                    {npsByType.mentees.score}
                  </p>
                  <p className="text-xs text-muted-foreground">{npsByType.mentees.total} respostas</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Mentores</p>
                  <p className={`text-xl font-bold ${getNpsLabel(npsByType.mentors.score).color}`}>
                    {npsByType.mentors.score}
                  </p>
                  <p className="text-xs text-muted-foreground">{npsByType.mentors.total} respostas</p>
                </div>
              </div>

              {recentFeedback.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Últimos feedbacks</h4>
                  <div className="space-y-2">
                    {recentFeedback.map((fb, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            fb.nota >= 9 ? "bg-emerald-100 text-emerald-700" :
                            fb.nota >= 7 ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {fb.nota}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {fb.user_type === "mentor" ? "Mentor" : "Mentorado"}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">{fb.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrailsNpsPanel;
