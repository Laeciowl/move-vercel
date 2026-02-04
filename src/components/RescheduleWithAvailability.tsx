import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X, Loader2, RefreshCw, MessageSquare, Clock, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, getDay, startOfDay, addMinutes, addHours, isWithinInterval, parseISO, isBefore, isSameDay, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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

interface BookedSession {
  scheduled_at: string;
  duration: number;
  status: string;
  id: string;
}

interface RescheduleWithAvailabilityProps {
  sessionId: string;
  scheduledAt: string;
  mentorName: string;
  mentorId: string;
  menteeName?: string;
  menteeEmail?: string;
  mentorEmail?: string;
  userRole: "mentor" | "mentee";
  onUpdate: () => void;
  onClose: () => void;
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

const RescheduleWithAvailability = ({
  sessionId,
  scheduledAt,
  mentorName,
  mentorId,
  menteeName,
  menteeEmail,
  mentorEmail,
  userRole,
  onUpdate,
  onClose,
}: RescheduleWithAvailabilityProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMentor, setLoadingMentor] = useState(true);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [minAdvanceHours, setMinAdvanceHours] = useState<number>(24);

  const sessionDate = new Date(scheduledAt);
  const formattedDate = format(sessionDate, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });

  // Fetch mentor availability, blocked periods, and existing booked sessions
  useEffect(() => {
    const fetchMentorData = async () => {
      setLoadingMentor(true);
      
      const { data: mentor } = await supabase
        .from("mentors")
        .select("availability, min_advance_hours")
        .eq("id", mentorId)
        .single();

      if (mentor) {
        setAvailability((mentor.availability as unknown as Availability[]) || []);
        setMinAdvanceHours((mentor as any).min_advance_hours ?? 24);
      }

      const { data: blocked } = await supabase
        .from("mentor_blocked_periods")
        .select("start_date, end_date, reason")
        .eq("mentor_id", mentorId)
        .gte("end_date", new Date().toISOString().split("T")[0]);

      if (blocked) {
        setBlockedPeriods(blocked);
      }

      // Important: use safe backend function so mentees can also see occupied slots
      // without exposing any user-identifying data.
      const { data: slots, error: slotsError } = await supabase.rpc(
        "get_mentor_booked_slots",
        { _mentor_id: mentorId }
      );

      if (!slotsError) {
        const currentStartMs = parseISO(scheduledAt).getTime();
        const filtered = (slots || []).filter((s: any) => {
          try {
            return parseISO(s.scheduled_at).getTime() !== currentStartMs;
          } catch {
            return true;
          }
        });
        setBookedSessions(filtered as unknown as BookedSession[]);
      } else {
        console.error("Error fetching booked slots:", slotsError);
        setBookedSessions([]);
      }

      setLoadingMentor(false);
    };

    fetchMentorData();
  }, [mentorId, sessionId]);

  // Check if a time slot is in the past or doesn't meet minimum advance booking
  const isTimeSlotInPastOrTooSoon = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const minBookingTime = addHours(now, minAdvanceHours);
    
    return isBefore(slotDateTime, minBookingTime);
  };

  // Check if a time slot conflicts with existing sessions
  const isTimeSlotBooked = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, 30);
    
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

  // Get available weekdays from mentor's availability
  const availableDayIndices = useMemo(() => {
    return availability.map((a) => dayIndexMap[a.day]);
  }, [availability]);

  const getDayName = (date: Date): string | undefined => {
    const dayIndex = getDay(date);
    return Object.entries(dayIndexMap).find(([_, idx]) => idx === dayIndex)?.[0];
  };

  const getAvailableTimesForDate = (date: Date): string[] => {
    const dayName = getDayName(date);
    if (!dayName) return [];

    const dayAvailability = availability.find((a) => a.day === dayName);
    const allTimes = dayAvailability?.times || [];

    return allTimes.filter((time) => {
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
  }, [selectedDate, availability, bookedSessions, minAdvanceHours]);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Selecione a nova data e horário");
      return;
    }

    setLoading(true);

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const newScheduledAt = new Date(selectedDate);
    newScheduledAt.setHours(hours, minutes, 0, 0);
    
    const newFormattedDate = format(newScheduledAt, "EEEE, d 'de' MMMM 'às' HH:mm", { locale: ptBR });

    const { error } = await supabase
      .from("mentor_sessions")
      .update({
        scheduled_at: newScheduledAt.toISOString(),
        confirmed_by_mentor: false,
        mentor_notes: reason || `Remarcado pelo ${userRole === "mentor" ? "mentor" : "mentorado"}`,
      })
      .eq("id", sessionId);

    if (error) {
      toast.error("Erro ao remarcar sessão: " + error.message);
      setLoading(false);
      return;
    }

    // Send reschedule emails
    const recipientEmail = userRole === "mentor" ? menteeEmail : mentorEmail;
    const recipientName = userRole === "mentor" ? menteeName : mentorName;
    const rescheduledBy = userRole === "mentor" ? mentorName : menteeName;

    if (recipientEmail) {
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: recipientEmail,
            name: recipientName || "Usuário",
            type: "session_rescheduled",
            data: {
              oldDate: formattedDate,
              newDate: newFormattedDate,
              rescheduledBy: rescheduledBy || "O participante",
              reason: reason || "Não informado",
              userRole: userRole,
            },
          },
        });
      } catch (err) {
        console.error("Error sending reschedule email:", err);
      }
    }

    toast.success("Sessão remarcada com sucesso");
    onClose();
    onUpdate();
    setLoading(false);
  };

  if (loadingMentor) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-sm text-foreground font-medium">
          {userRole === "mentor" ? menteeName : mentorName}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3" />
          Atual: {formattedDate}
        </p>
      </div>

      {/* Minimum advance booking notice */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Remarcações devem ser feitas com pelo menos <strong className="text-foreground">{minAdvanceHours} horas de antecedência</strong>.
        </p>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <CalendarComponent
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

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1">
          <MessageSquare className="w-4 h-4" />
          Motivo (opcional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
          placeholder="Ex: Preciso mudar o horário por conta de..."
          maxLength={500}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Voltar
        </Button>
        <Button
          onClick={handleReschedule}
          disabled={loading || !selectedDate || !selectedTime}
          className="flex-1"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Confirmar remarcação"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RescheduleWithAvailability;
