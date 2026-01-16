import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfDay, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Loader2, AlertCircle } from "lucide-react";
import { isDateBlocked, getBlockedReason, isHoliday } from "@/lib/brazilianHolidays";

interface Availability {
  day: string;
  times: string[];
}

interface BlockedPeriod {
  start_date: string;
  end_date: string;
  reason?: string;
}

interface BookingCalendarProps {
  availability: Availability[];
  blockedPeriods: BlockedPeriod[];
  onConfirm: (date: Date, time: string) => Promise<void>;
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

const BookingCalendar = ({ 
  availability, 
  blockedPeriods, 
  onConfirm, 
  loading 
}: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Get available weekdays from mentor's availability
  const availableDayIndices = useMemo(() => {
    return availability.map(a => dayIndexMap[a.day]);
  }, [availability]);

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

  // Get available times for selected date
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayIndex = getDay(selectedDate);
    const dayName = Object.entries(dayIndexMap).find(([_, idx]) => idx === dayIndex)?.[0];
    
    if (!dayName) return [];
    
    const dayAvailability = availability.find(a => a.day === dayName);
    return dayAvailability?.times || [];
  }, [selectedDate, availability]);

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
    
    await onConfirm(bookingDate, selectedTime);
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

      {/* No times available */}
      {selectedDate && availableTimes.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-xl">
          <AlertCircle className="w-4 h-4" />
          <span>Nenhum horário disponível nesta data</span>
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedDate || !selectedTime || loading}
        className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Confirmar agendamento
      </button>

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
