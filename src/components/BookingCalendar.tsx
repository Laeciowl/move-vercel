import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfDay, isSameDay, getDay, addMinutes, addHours, isWithinInterval, parseISO, isBefore, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Loader2, AlertCircle, Timer, GraduationCap, Target, Info } from "lucide-react";
import { isDateBlocked, getBlockedReason, isHoliday } from "@/lib/brazilianHolidays";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Availability {
  day: string;
  times: string[];
}

interface BlockedPeriod {
  start_date: string;
  end_date: string;
  reason?: string;
}

interface BookedSession {
  scheduled_at: string;
  duration: number;
  status: string;
}

interface BookingCalendarProps {
  availability: Availability[];
  blockedPeriods: BlockedPeriod[];
  bookedSessions?: BookedSession[];
  onConfirm: (date: Date, time: string, duration: number, formation: string, objective: string) => Promise<void>;
  loading: boolean;
  minAdvanceHours?: number;
}

const dayIndexMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const dayLabels: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const DURATION_OPTIONS = [
  { value: 30, label: "30 min", description: "Conversa rápida" },
  { value: 45, label: "45 min", description: "Sessão padrão" },
  { value: 60, label: "1 hora", description: "Mentoria completa" },
];

const BookingCalendar = ({ 
  availability, 
  blockedPeriods,
  bookedSessions = [],
  onConfirm, 
  loading,
  minAdvanceHours = 24,
}: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [formation, setFormation] = useState<string>("");
  const [objective, setObjective] = useState<string>("");

  const MIN_ADVANCE_HOURS = minAdvanceHours;

  // Get available weekdays from mentor's availability
  const availableDayIndices = useMemo(() => {
    return availability.map(a => dayIndexMap[a.day]);
  }, [availability]);

  const getDayName = (date: Date): string | undefined => {
    const dayIndex = getDay(date);
    return Object.entries(dayIndexMap).find(([_, idx]) => idx === dayIndex)?.[0];
  };

  // Check if a time slot is in the past or doesn't meet minimum advance booking
  const isTimeSlotInPastOrTooSoon = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const minBookingTime = addHours(now, MIN_ADVANCE_HOURS);
    
    // Slot must be at least MIN_ADVANCE_HOURS in the future
    return isBefore(slotDateTime, minBookingTime);
  };

  // Check if a time slot conflicts with existing sessions
  const isTimeSlotBooked = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, 30);
    
    // Check against all booked sessions
    for (const session of bookedSessions) {
      const sessionStart = parseISO(session.scheduled_at);
      const sessionDuration = session.duration || 30;
      const sessionEnd = addMinutes(sessionStart, sessionDuration);
      
      // Check if the slot overlaps with this session
      // Two time ranges overlap if: start1 < end2 AND end1 > start2
      const slotsOverlap = isBefore(slotStart, sessionEnd) && isAfter(slotEnd, sessionStart);
      
      if (slotsOverlap) {
        return true;
      }
    }
    
    return false;
  };

  const getAvailableTimesForDate = (date: Date): string[] => {
    const dayName = getDayName(date);
    if (!dayName) return [];

    const dayAvailability = availability.find(a => a.day === dayName);
    const allTimes = dayAvailability?.times || [];

    return allTimes.filter(time => {
      if (isTimeSlotInPastOrTooSoon(date, time)) return false;
      if (isTimeSlotBooked(date, time)) return false;
      return true;
    });
  };

  // Disable dates function
  const isDateDisabled = (date: Date): boolean => {
    const today = startOfDay(new Date());
    
    // Past dates
    if (date < today) return true;
    
    // Check if it's a day the mentor works
    const dayIndex = getDay(date);
    if (!availableDayIndices.includes(dayIndex)) return true;
    
    // Check holidays and blocked periods
    if (isDateBlocked(date, blockedPeriods)) return true;

    // If the mentor has no actual free slots on this date, show it as unavailable (disabled)
    if (getAvailableTimesForDate(date).length === 0) return true;
    
    return false;
  };

  // Get available times for selected date, filtering out already booked slots and past times
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    return getAvailableTimesForDate(selectedDate);
  }, [selectedDate, availability, bookedSessions, MIN_ADVANCE_HOURS]);

  // Get reason why date is blocked (for tooltip)
  const getDisabledReason = (date: Date): string | undefined => {
    const now = new Date();
    const minBookingTime = addHours(now, MIN_ADVANCE_HOURS);
    
    if (date < startOfDay(now)) return "Data passada";
    
    // Check if all times for this day would be within minimum advance window
    if (date < startOfDay(minBookingTime)) {
      // Might still have some slots available later in the day
    }
    
    const dayIndex = getDay(date);
    if (!availableDayIndices.includes(dayIndex)) {
      return "Mentor não disponível neste dia da semana";
    }
    
    return getBlockedReason(date, blockedPeriods);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !formation.trim() || !objective.trim()) return;
    
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes, 0, 0);
    
    await onConfirm(bookingDate, selectedTime, selectedDuration, formation.trim(), objective.trim());
  };

  const isFormComplete = selectedDate && selectedTime && formation.trim() && objective.trim();

  return (
    <div className="space-y-6">
      {/* Minimum advance booking notice */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Agendamentos devem ser feitos com pelo menos <strong className="text-foreground">{MIN_ADVANCE_HOURS} horas de antecedência</strong>.
        </p>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            setSelectedTime("");
          }}
          disabled={isDateDisabled}
          locale={ptBR}
          className="rounded-xl border border-border"
          modifiers={{
            holiday: (date) => !!isHoliday(date),
          }}
          modifiersClassNames={{
            holiday: "text-destructive line-through",
          }}
        />
      </div>

      {/* Selected date info */}
      {selectedDate && (
        <div className="bg-accent/50 rounded-xl p-4">
          <p className="text-sm font-medium text-foreground">
            📅 {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      )}

      {/* Time slots */}
      {selectedDate && availableTimes.length > 0 && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <Clock className="w-4 h-4 text-primary" />
            Horários disponíveis
          </label>
          <div className="grid grid-cols-4 gap-2">
            {availableTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTime === time
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duration selection */}
      {selectedDate && selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
            <Timer className="w-4 h-4 text-primary" />
            Duração da mentoria
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setSelectedDuration(option.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-xl text-center transition-all border ${
                  selectedDuration === option.value
                    ? "bg-primary text-primary-foreground border-primary shadow-button"
                    : "bg-muted text-foreground hover:bg-muted/80 border-border/50"
                }`}
              >
                <span className="block font-semibold text-sm">{option.label}</span>
                <span className={`block text-xs mt-0.5 ${
                  selectedDuration === option.value ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}>
                  {option.description}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Formation and Objective fields */}
      {selectedDate && selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Formation */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              Sua formação <span className="text-destructive">*</span>
            </label>
            <Input
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              placeholder="Ex: Graduação em Administração, Técnico em TI..."
              className="bg-background"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Informe seu nível de formação e área (ex: Ensino Médio, Graduação em Marketing)
            </p>
          </div>

          {/* Objective */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <Target className="w-4 h-4 text-primary" />
              Objetivo com a mentoria <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Descreva brevemente o que você espera da mentoria..."
              className="bg-background min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Isso ajuda o mentor a se preparar melhor para a sessão
            </p>
          </div>
        </motion.div>
      )}

      {/* No times available */}
      {selectedDate && availableTimes.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-xl">
          <AlertCircle className="w-4 h-4" />
          <span>Nenhum horário disponível nesta data</span>
        </div>
      )}

      {/* Confirm button */}
      <motion.button
        onClick={handleConfirm}
        disabled={!isFormComplete || loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full bg-gradient-hero text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-button"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Confirmar agendamento ({DURATION_OPTIONS.find(d => d.value === selectedDuration)?.label})
      </motion.button>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Data selecionada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive/20" />
          <span>Feriado</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
