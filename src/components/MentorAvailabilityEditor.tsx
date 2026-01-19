import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, X, Loader2, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Availability {
  day: string;
  times: string[];
}

interface MentorAvailabilityEditorProps {
  mentorId: string;
  initialAvailability: Availability[];
  onUpdate: () => void;
}

const dayOptions = [
  { value: "monday", label: "Segunda-feira" },
  { value: "tuesday", label: "Terça-feira" },
  { value: "wednesday", label: "Quarta-feira" },
  { value: "thursday", label: "Quinta-feira" },
  { value: "friday", label: "Sexta-feira" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const timeSlots = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00",
];

const MentorAvailabilityEditor = ({
  mentorId,
  initialAvailability,
  onUpdate,
}: MentorAvailabilityEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>(initialAvailability);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAvailability(initialAvailability);
  }, [initialAvailability]);

  const addDay = () => {
    // Find first day not already in availability
    const usedDays = availability.map((a) => a.day);
    const nextDay = dayOptions.find((d) => !usedDays.includes(d.value));
    
    if (nextDay) {
      setAvailability([...availability, { day: nextDay.value, times: [] }]);
    } else {
      toast.error("Todos os dias já foram adicionados");
    }
  };

  const removeDay = (dayToRemove: string) => {
    setAvailability(availability.filter((a) => a.day !== dayToRemove));
  };

  const updateDay = (oldDay: string, newDay: string) => {
    setAvailability(
      availability.map((a) => (a.day === oldDay ? { ...a, day: newDay } : a))
    );
  };

  const toggleTime = (day: string, time: string) => {
    setAvailability(
      availability.map((a) => {
        if (a.day !== day) return a;
        const times = a.times.includes(time)
          ? a.times.filter((t) => t !== time)
          : [...a.times, time].sort();
        return { ...a, times };
      })
    );
  };

  const handleSave = async () => {
    // Validate: each day must have at least one time
    const invalidDays = availability.filter((a) => a.times.length === 0);
    if (invalidDays.length > 0) {
      toast.error("Cada dia deve ter pelo menos um horário selecionado");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("mentors")
      .update({ availability: JSON.parse(JSON.stringify(availability)) })
      .eq("id", mentorId);

    if (error) {
      toast.error("Erro ao salvar disponibilidade: " + error.message);
    } else {
      toast.success("Disponibilidade atualizada! 📅");
      setIsOpen(false);
      onUpdate();
    }

    setSaving(false);
  };

  const getDayLabel = (day: string) => {
    return dayOptions.find((d) => d.value === day)?.label || day;
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group"
      >
        <Clock className="w-4 h-4 transition-transform group-hover:scale-110 duration-300" />
        {isOpen ? "Ocultar" : "Editar"} disponibilidade
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-accent/30 rounded-2xl p-4 space-y-4 border border-border/50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Sua disponibilidade semanal
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDay}
                  disabled={availability.length >= 7}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar dia
                </Button>
              </div>

              {availability.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dia configurado. Clique em "Adicionar dia" para começar.
                </p>
              )}

              <div className="space-y-4">
                {availability.map((avail, index) => (
                  <motion.div
                    key={avail.day}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-card rounded-xl p-4 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <select
                        value={avail.day}
                        onChange={(e) => updateDay(avail.day, e.target.value)}
                        className="px-3 py-2 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        {dayOptions.map((day) => (
                          <option
                            key={day.value}
                            value={day.value}
                            disabled={
                              availability.some((a) => a.day === day.value) &&
                              avail.day !== day.value
                            }
                          >
                            {day.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeDay(avail.day)}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleTime(avail.day, time)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            avail.times.includes(time)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>

                    {avail.times.length === 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        ⚠️ Selecione pelo menos um horário
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAvailability(initialAvailability);
                    setIsOpen(false);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || availability.length === 0}
                  className="flex-1"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar alterações
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentorAvailabilityEditor;
