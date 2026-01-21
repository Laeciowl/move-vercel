import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfDay, isSameDay, getDay, addMinutes, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Loader2, AlertCircle, Timer } from "lucide-react";
import { isDateBlocked, getBlockedReason, isHoliday } from "@/lib/brazilianHolidays";
import { motion } from "framer-motion";

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
  onConfirm: (date: Date, time: string, duration: number) => Promise<void>;
  loading: boolean;
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
  loading 
}: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  // Get available weekdays from mentor's availability
  const availableDayIndices = useMemo(() => {
    return availability.map(a => dayIndexMap[a.day]);
  }, [availability]);

  // Check if a time slot conflicts with existing sessions
  const isTimeSlotBooked = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    
    // Check against all booked sessions
    for (const session of bookedSessions) {
      const sessionStart = parseISO(session.scheduled_at);
      const sessionEnd = addMinutes(sessionStart, session.duration || 30);
      
      // Check if slot start falls within an existing session
      if (isWithinInterval(slotStart, { start: sessionStart, end: sessionEnd })) {
        return true;
      }
      
      // Also check if an existing session starts within a potential new slot
      // Assuming a default 30-min slot for this check
      const slotEnd = addMinutes(slotStart, 30);
      if (isWithinInterval(sessionStart, { start: slotStart, end: slotEnd })) {
        return true;
      }
    }
    
    return false;
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
    
    return false;
  };

  // Get available times for selected date, filtering out already booked slots
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayIndex = getDay(selectedDate);
    const dayName = Object.entries(dayIndexMap).find(([_, idx]) => idx === dayIndex)?.[0];
    
    if (!dayName) return [];
    
    const dayAvailability = availability.find(a => a.day === dayName);
    const allTimes = dayAvailability?.times || [];
    
    // Filter out times that are already booked
    return allTimes.filter(time => !isTimeSlotBooked(selectedDate, time));
  }, [selectedDate, availability, bookedSessions]);

  // Get reason why date is blocked (for tooltip)
  const getDisabledReason = (date: Date): string | undefined => {
    if (date < startOfDay(new Date())) return "Data passada";
    
    const dayIndex = getDay(date);
    if (!availableDayIndices.includes(dayIndex)) {
      return "Mentor não disponível neste dia da semana";
    }
    
    return getBlockedReason(date, blockedPeriods);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(hours, minutes, 0, 0);
    
    await onConfirm(bookingDate, selectedTime, selectedDuration);
  };

  return (
    <div className="space-y-6">
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
        disabled={!selectedDate || !selectedTime || loading}
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
