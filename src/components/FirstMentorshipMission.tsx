import { useState, useEffect } from "react";
import { Target, ArrowRight, CheckCircle2, Star, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface FirstMentorshipMissionProps {
  isCompleted: boolean;
}

const FirstMentorshipMission = ({ isCompleted }: FirstMentorshipMissionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completedSessions, setCompletedSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isCompleted) {
      setLoading(false);
      return;
    }
    const fetchCompletedSessions = async () => {
      const { count, error } = await supabase
        .from("mentor_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");
      if (!error && count !== null) setCompletedSessions(count);
      setLoading(false);
    };
    fetchCompletedSessions();
  }, [user, isCompleted]);

  const getNextMilestone = () => {
    if (completedSessions < 3) return { target: 3, label: "3 mentorias" };
    if (completedSessions < 5) return { target: 5, label: "5 mentorias" };
    if (completedSessions < 10) return { target: 10, label: "10 mentorias" };
    return null;
  };

  const nextMilestone = getNextMilestone();

  if (!isCompleted) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-amber-500/10 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-primary-foreground" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">Sua primeira missão</h3>
          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium ml-auto">Pendente</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">Agende sua primeira mentoria e comece sua jornada!</p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground">0/1 mentoria</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
          <div className="h-full bg-gradient-hero w-[5%]" />
        </div>
        <Button onClick={() => navigate("/mentores")} size="sm" className="rounded-xl bg-gradient-hero text-primary-foreground text-xs gap-1.5 h-8">
          Encontrar mentor <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
          {nextMilestone ? <Rocket className="w-4 h-4 text-green-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
        </div>
        <h3 className="font-semibold text-green-700 dark:text-green-400 text-sm">
          {completedSessions} {completedSessions === 1 ? "mentoria realizada" : "mentorias realizadas"}!
        </h3>
      </div>
      {nextMilestone ? (
        <>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" /> Próxima meta: {nextMilestone.label}</span>
            <span className="font-medium text-foreground">{completedSessions}/{nextMilestone.target}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all" style={{ width: `${(completedSessions / nextMilestone.target) * 100}%` }} />
          </div>
          <Button onClick={() => navigate("/mentores")} size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 h-8 border-green-500/30 text-green-700 hover:bg-green-500/10">
            Agendar próxima <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span className="text-green-700 dark:text-green-400 font-medium">Meta de 10 mentorias alcançada! 🏆</span>
        </div>
      )}
    </div>
  );
};

export default FirstMentorshipMission;
