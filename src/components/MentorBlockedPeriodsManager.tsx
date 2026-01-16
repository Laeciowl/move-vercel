import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Trash2, Loader2, CalendarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";

interface BlockedPeriod {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
}

interface MentorBlockedPeriodsManagerProps {
  mentorId: string;
}

const MentorBlockedPeriodsManager = ({ mentorId }: MentorBlockedPeriodsManagerProps) => {
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchBlockedPeriods();
  }, [mentorId]);

  const fetchBlockedPeriods = async () => {
    const { data, error } = await supabase
      .from("mentor_blocked_periods")
      .select("*")
      .eq("mentor_id", mentorId)
      .order("start_date", { ascending: true });

    if (data && !error) {
      setBlockedPeriods(data);
    }
    setLoading(false);
  };

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPeriod.start_date || !newPeriod.end_date) {
      toast.error("Selecione as datas de início e fim");
      return;
    }

    if (newPeriod.end_date < newPeriod.start_date) {
      toast.error("A data final deve ser após a data inicial");
      return;
    }

    setAdding(true);

    const { error } = await supabase
      .from("mentor_blocked_periods")
      .insert({
        mentor_id: mentorId,
        start_date: newPeriod.start_date,
        end_date: newPeriod.end_date,
        reason: newPeriod.reason || null,
      });

    if (error) {
      toast.error("Erro ao adicionar bloqueio: " + error.message);
    } else {
      toast.success("Período bloqueado com sucesso!");
      setNewPeriod({ start_date: "", end_date: "", reason: "" });
      setShowAddForm(false);
      fetchBlockedPeriods();
    }

    setAdding(false);
  };

  const handleDeletePeriod = async (periodId: string) => {
    const { error } = await supabase
      .from("mentor_blocked_periods")
      .delete()
      .eq("id", periodId);

    if (error) {
      toast.error("Erro ao remover bloqueio: " + error.message);
    } else {
      toast.success("Bloqueio removido!");
      setBlockedPeriods(prev => prev.filter(p => p.id !== periodId));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarOff className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Períodos Bloqueados</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Plus className="w-4 h-4" />
          Adicionar bloqueio
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Bloqueie períodos em que você não estará disponível (férias, viagens, etc.)
      </p>

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddPeriod}
            className="bg-accent/50 rounded-xl p-4 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data inicial
                </label>
                <Input
                  type="date"
                  value={newPeriod.start_date}
                  onChange={(e) => setNewPeriod({ ...newPeriod, start_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data final
                </label>
                <Input
                  type="date"
                  value={newPeriod.end_date}
                  onChange={(e) => setNewPeriod({ ...newPeriod, end_date: e.target.value })}
                  min={newPeriod.start_date || new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Motivo (opcional)
              </label>
              <Input
                type="text"
                value={newPeriod.reason}
                onChange={(e) => setNewPeriod({ ...newPeriod, reason: e.target.value })}
                placeholder="Ex: Férias, viagem, compromisso pessoal..."
                maxLength={100}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* List of blocked periods */}
      {blockedPeriods.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nenhum período bloqueado
        </div>
      ) : (
        <div className="space-y-2">
          {blockedPeriods.map((period) => (
            <div
              key={period.id}
              className="flex items-center justify-between bg-muted rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                  </p>
                  {period.reason && (
                    <p className="text-xs text-muted-foreground">{period.reason}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeletePeriod(period.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorBlockedPeriodsManager;
