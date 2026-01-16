import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Loader2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Availability {
  day: string;
  times: string[];
}

interface Mentor {
  id: string;
  name: string;
  area: string;
  description: string;
  education: string | null;
  photo_url: string | null;
  availability: Availability[];
}

const dayLabels: Record<string, string> = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const Mentors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchMentors = async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("*")
        .eq("status", "approved");

      if (error) {
        console.error("Error fetching mentors:", error);
      } else if (data) {
        const formattedMentors = data.map((m) => ({
          ...m,
          availability: (m.availability as unknown as Availability[]) || [],
        }));
        setMentors(formattedMentors);
      }
      setLoading(false);
    };

    fetchMentors();
  }, []);

  const handleBookSession = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para agendar uma mentoria");
      navigate("/auth?cadastro=true");
      return;
    }

    if (!selectedMentor || !selectedDay || !selectedTime) {
      toast.error("Selecione um dia e horário");
      return;
    }

    setBooking(true);

    // Create a date for next occurrence of selected day
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = days.indexOf(selectedDay);
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) daysUntilTarget += 7;

    const sessionDate = new Date(now);
    sessionDate.setDate(now.getDate() + daysUntilTarget);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);

    const { error } = await supabase.from("mentor_sessions").insert({
      mentor_id: selectedMentor.id,
      user_id: user.id,
      scheduled_at: sessionDate.toISOString(),
    });

    if (error) {
      toast.error("Erro ao agendar: " + error.message);
    } else {
      toast.success("Mentoria agendada com sucesso!");
      setDialogOpen(false);
      setSelectedDay("");
      setSelectedTime("");
    }

    setBooking(false);
  };

  const openBookingDialog = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setSelectedDay("");
    setSelectedTime("");
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-warm py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
            Nossos Mentores
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Conheça os profissionais voluntários que estão prontos para te ajudar
            na sua jornada profissional.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : mentors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor, index) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl shadow-card overflow-hidden"
              >
                <div className="aspect-square bg-muted relative">
                  {mentor.photo_url ? (
                    <img
                      src={mentor.photo_url}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-20 h-20 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {mentor.name}
                  </h3>
                  <p className="text-primary font-medium text-sm mb-3">
                    {mentor.area}
                  </p>

                  {mentor.education && (
                    <div className="flex items-start gap-2 mb-3">
                      <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {mentor.education}
                      </p>
                    </div>
                  )}

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {mentor.description}
                  </p>

                  {mentor.availability && mentor.availability.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {mentor.availability
                          .slice(0, 3)
                          .map((a) => dayLabels[a.day])
                          .join(", ")}
                        {mentor.availability.length > 3 && "..."}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => openBookingDialog(mentor)}
                    className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar mentoria
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-card p-12 text-center max-w-md mx-auto"
          >
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Nenhum mentor disponível ainda
            </h3>
            <p className="text-muted-foreground mb-6">
              Em breve teremos mentores prontos para te ajudar!
            </p>
            <button
              onClick={() => navigate("/voluntario")}
              className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Quero ser mentor
            </button>
          </motion.div>
        )}

        {/* Booking Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agendar mentoria</DialogTitle>
              <DialogDescription>
                {selectedMentor && (
                  <>Agende uma sessão com {selectedMentor.name}</>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedMentor && selectedMentor.availability && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Dia
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => {
                      setSelectedDay(e.target.value);
                      setSelectedTime("");
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione um dia</option>
                    {selectedMentor.availability.map((avail) => (
                      <option key={avail.day} value={avail.day}>
                        {dayLabels[avail.day]}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedDay && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Horário
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Selecione um horário</option>
                      {selectedMentor.availability
                        .find((a) => a.day === selectedDay)
                        ?.times.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={handleBookSession}
                  disabled={!selectedDay || !selectedTime || booking}
                  className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {booking && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar agendamento
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Mentors;
