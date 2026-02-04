import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Clock, User, Loader2, GraduationCap, MessageSquare, Award, Linkedin, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMentorCheck } from "@/hooks/useMentorCheck";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BookingCalendar from "@/components/BookingCalendar";
import MentorRatingDisplay from "@/components/MentorRatingDisplay";
import MentorReviewsList from "@/components/MentorReviewsList";
import MentorShareButton from "@/components/MentorShareButton";
import { Button } from "@/components/ui/button";

interface Availability {
  day: string;
  times: string[];
}

interface BlockedPeriod {
  start_date: string;
  end_date: string;
  reason?: string;
}

interface Review {
  id: string;
  comment: string | null;
  created_at: string;
}

interface Mentor {
  id: string;
  name: string;
  area: string;
  description: string;
  education: string | null;
  photo_url: string | null;
  availability: Availability[];
  totalReviews: number;
  reviews: Review[];
  min_advance_hours: number;
  sessions_completed_count: number;
  linkedin_url: string | null;
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

interface BookedSession {
  scheduled_at: string;
  duration: number;
  status: string;
}

const Mentors = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isMentor, mentorId: currentUserMentorId } = useMentorCheck();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);
  const [booking, setBooking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [selectedMentorForReviews, setSelectedMentorForReviews] = useState<Mentor | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedMentorForProfile, setSelectedMentorForProfile] = useState<Mentor | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      // Use mentors_public view which excludes sensitive email data
      const { data, error } = await supabase
        .from("mentors_public")
        .select("*");

      if (error) {
        console.error("Error fetching mentors:", error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setMentors([]);
        setLoading(false);
        return;
      }

      // Get all mentor IDs
      const mentorIds = data.map(m => m.id).filter(Boolean) as string[];

      // Fetch reviews and completed sessions count in parallel
      const [reviewsResult, ...sessionsResults] = await Promise.all([
        supabase
          .from("session_reviews")
          .select("*")
          .in("mentor_id", mentorIds)
          .order("created_at", { ascending: false }),
        // Fetch completed sessions count for each mentor
        ...mentorIds.map(id => 
          supabase.rpc("get_mentor_sessions_completed_count", { _mentor_id: id })
        )
      ]);

      // Group reviews by mentor
      const reviewsByMentor = new Map<string, Review[]>();
      (reviewsResult.data || []).forEach(review => {
        const existing = reviewsByMentor.get(review.mentor_id) || [];
        existing.push({
          id: review.id,
          comment: review.comment,
          created_at: review.created_at
        });
        reviewsByMentor.set(review.mentor_id, existing);
      });

      // Map completed sessions count by mentor ID
      const sessionsCountByMentor = new Map<string, number>();
      mentorIds.forEach((id, index) => {
        sessionsCountByMentor.set(id, sessionsResults[index]?.data ?? 0);
      });

      const formattedMentors = data.map((m) => {
        const mentorReviews = reviewsByMentor.get(m.id!) || [];
        // Only count reviews that have comments for display
        const reviewsWithComments = mentorReviews.filter(r => r.comment?.trim()).length;
        // Get actual completed sessions count from RPC
        const completedSessions = sessionsCountByMentor.get(m.id!) ?? 0;

        return {
          ...m,
          id: m.id!,
          name: m.name!,
          area: m.area!,
          description: m.description!,
          availability: (m.availability as unknown as Availability[]) || [],
          reviews: mentorReviews,
          totalReviews: reviewsWithComments,
          min_advance_hours: (m as any).min_advance_hours ?? 24,
          sessions_completed_count: completedSessions,
          linkedin_url: (m as any).linkedin_url ?? null,
        };
      });

      // Sort by number of completed sessions (most first), then by reviews
      formattedMentors.sort((a, b) => {
        if (b.sessions_completed_count !== a.sessions_completed_count) {
          return b.sessions_completed_count - a.sessions_completed_count;
        }
        return b.totalReviews - a.totalReviews;
      });

      setMentors(formattedMentors);
      setLoading(false);
    };

    fetchMentors();
  }, []);

  const fetchBlockedPeriods = async (mentorId: string) => {
    const { data, error } = await supabase
      .from("mentor_blocked_periods")
      .select("start_date, end_date, reason")
      .eq("mentor_id", mentorId);

    if (data && !error) {
      setBlockedPeriods(data);
    }
  };

  const fetchBookedSessions = async (mentorId: string) => {
    // Important: do NOT query mentor_sessions directly here.
    // Regular users don't have permission to see other users' sessions, which would
    // make occupied slots look available. Use the safe backend function instead.
    const { data, error } = await supabase.rpc("get_mentor_booked_slots", {
      _mentor_id: mentorId,
    });

    if (error) {
      console.error("Error fetching booked sessions:", error);
      setBookedSessions([]);
      return;
    }

    setBookedSessions((data || []) as unknown as BookedSession[]);
  };

  const handleBookSession = async (date: Date, time: string, duration: number, formation: string, objective: string) => {
    if (!user) {
      toast.error("Crie uma conta ou faça login para agendar uma mentoria 😊");
      navigate("/cadastro");
      return;
    }

    if (!selectedMentor) {
      toast.error("Selecione um mentor");
      return;
    }

    // Garantir que o mentor consiga entrar em contato (telefone do mentorado)
    if (!profile?.phone) {
      toast.error("Antes de agendar, adiciona seu telefone no perfil — é assim que o mentor vai falar com você.");
      setDialogOpen(false);
      navigate("/dashboard?editarPerfil=1");
      return;
    }

    setBooking(true);

    const { error } = await supabase.from("mentor_sessions").insert({
      mentor_id: selectedMentor.id,
      user_id: user.id,
      scheduled_at: date.toISOString(),
      duration: duration,
      mentee_formation: formation,
      mentee_objective: objective,
    });

    if (error) {
      toast.error("Erro ao agendar: " + error.message);
      setBooking(false);
      return;
    }

    // Send email notification to mentor
    try {
      // Get mentor email from mentors table (need to fetch since we use public view)
      const { data: mentorData } = await supabase
        .from("mentors")
        .select("email")
        .eq("id", selectedMentor.id)
        .single();

      if (mentorData?.email) {
        const durationLabel = duration === 30 ? "30 min" : duration === 45 ? "45 min" : "1 hora";
        const formattedDate = new Intl.DateTimeFormat("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);

        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: mentorData.email,
            name: selectedMentor.name,
            type: "session_request_mentor",
            data: {
              menteeName: profile?.name || "Mentorado",
              date: formattedDate,
              duration: durationLabel,
              formation: formation,
              objective: objective,
            },
          },
        });
        console.log("Notification email sent to mentor:", mentorData.email);
      }
    } catch (emailError) {
      console.error("Error sending email to mentor:", emailError);
      // Don't show error to user, the session was still created
    }

    const durationLabel = duration === 30 ? "30 min" : duration === 45 ? "45 min" : "1 hora";
    toast.success(`Show! Mentoria de ${durationLabel} agendada! O mentor vai entrar em contato pra confirmar.`);
    setDialogOpen(false);
    setBooking(false);
  };

  const openBookingDialog = async (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setBlockedPeriods([]);
    setBookedSessions([]);
    setDialogOpen(true);
    // Fetch blocked periods and booked sessions in parallel
    await Promise.all([
      fetchBlockedPeriods(mentor.id),
      fetchBookedSessions(mentor.id),
    ]);
  };

  const openReviewsDialog = (mentor: Mentor) => {
    setSelectedMentorForReviews(mentor);
    setReviewsDialogOpen(true);
  };

  const openProfileDialog = (mentor: Mentor) => {
    setSelectedMentorForProfile(mentor);
    setProfileDialogOpen(true);
  };

  const handleBookFromProfile = async (mentor: Mentor) => {
    setProfileDialogOpen(false);
    await openBookingDialog(mentor);
  };

  return (
    <div className="min-h-screen bg-gradient-warm py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a página inicial
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
            Pessoas que querem te ver crescer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Profissionais incríveis que doam seu tempo pra conversar com você, 
            compartilhar experiências e te ajudar a dar os próximos passos.
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
                className="bg-card rounded-2xl shadow-card overflow-hidden group flex flex-col h-full"
              >
                {/* Fixed aspect ratio photo container */}
                <div 
                  className="aspect-[4/3] bg-muted relative cursor-pointer overflow-hidden"
                  onClick={() => openProfileDialog(mentor)}
                >
                  {mentor.photo_url ? (
                    <img
                      src={mentor.photo_url}
                      alt={mentor.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-20 h-20 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                {/* Content area with flex-grow to fill remaining space */}
                <div className="p-5 flex flex-col flex-1">
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openProfileDialog(mentor)}
                  >
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

                    <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                      {mentor.description}
                    </p>
                  </div>

                  {/* Session count + Reviews - separated clearly */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Award className="w-4 h-4 text-green-600" />
                      {mentor.sessions_completed_count} {mentor.sessions_completed_count === 1 ? 'sessão realizada' : 'sessões realizadas'}
                    </span>
                    <span className="text-muted-foreground/50">•</span>
                    {mentor.totalReviews > 0 ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs text-primary gap-1"
                        onClick={() => openReviewsDialog(mentor)}
                      >
                        {mentor.totalReviews} {mentor.totalReviews === 1 ? 'review' : 'reviews'}
                        <span className="underline">ver</span>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">0 reviews</span>
                    )}
                  </div>

                  {/* Stats bar: advance notice + LinkedIn */}
                  <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mentor.min_advance_hours}h de antecedência
                    </span>
                    {mentor.linkedin_url && (
                      <a
                        href={mentor.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#0A66C2] hover:opacity-70 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        title="Ver perfil no LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {mentor.availability && mentor.availability.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
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

                  {/* Spacer to push content below to bottom */}
                  <div className="flex-1" />

                  {/* Share button for mentor's own card */}
                  {isMentor && currentUserMentorId === mentor.id && (
                    <div className="mb-3">
                      <MentorShareButton
                        mentorId={mentor.id}
                        mentorName={mentor.name}
                        mentorArea={mentor.area}
                        mentorPhotoUrl={mentor.photo_url}
                      />
                    </div>
                  )}

                  {/* Booking button always at bottom */}
                  <div className="pt-2">
                    <button
                      onClick={() => openBookingDialog(mentor)}
                      className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Agendar mentoria
                    </button>
                  </div>
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
              Estamos montando nosso time 🚀
            </h3>
            <p className="text-muted-foreground mb-6">
              Logo mais você vai conhecer pessoas incríveis prontas pra te ouvir e orientar. 
              Enquanto isso, que tal fazer parte dessa história?
            </p>
            <button
              onClick={() => navigate("/voluntario")}
              className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Quero ser voluntário
            </button>
          </motion.div>
        )}

        {/* Booking Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar mentoria</DialogTitle>
              <DialogDescription>
                {selectedMentor && (
                  <>Escolha uma data e horário disponível com {selectedMentor.name}</>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedMentor && selectedMentor.availability && (
              <BookingCalendar
                availability={selectedMentor.availability}
                blockedPeriods={blockedPeriods}
                bookedSessions={bookedSessions}
                onConfirm={handleBookSession}
                loading={booking}
                minAdvanceHours={selectedMentor.min_advance_hours}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Reviews Dialog */}
        <Dialog open={reviewsDialogOpen} onOpenChange={setReviewsDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Feedbacks sobre {selectedMentorForReviews?.name}</DialogTitle>
              <DialogDescription>
                {selectedMentorForReviews && (
                  <MentorRatingDisplay
                    totalReviews={selectedMentorForReviews.totalReviews}
                    size="md"
                  />
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedMentorForReviews && (
              <MentorReviewsList
                reviews={selectedMentorForReviews.reviews}
                maxVisible={10}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Profile Dialog */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            {selectedMentorForProfile && (
              <>
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-muted mb-4">
                    {selectedMentorForProfile.photo_url ? (
                      <img
                        src={selectedMentorForProfile.photo_url}
                        alt={selectedMentorForProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedMentorForProfile.name}
                  </h2>
                  <p className="text-primary font-medium">
                    {selectedMentorForProfile.area}
                  </p>
                </div>

                {selectedMentorForProfile.education && (
                  <div className="flex items-start gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {selectedMentorForProfile.education}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Sobre</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {selectedMentorForProfile.description}
                  </p>
                </div>

                {/* Stats + LinkedIn */}
                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {selectedMentorForProfile.sessions_completed_count > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-green-600" />
                      {selectedMentorForProfile.sessions_completed_count} sessões realizadas
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {selectedMentorForProfile.min_advance_hours}h de antecedência
                  </span>
                  {selectedMentorForProfile.linkedin_url && (
                    <a
                      href={selectedMentorForProfile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#0A66C2] hover:underline"
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                </div>

                {/* Aviso de antecedência */}
                <div className="flex items-start gap-2 p-3 mb-4 bg-muted/50 rounded-lg border border-border/50">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Agendamentos devem ser feitos com pelo menos <strong className="text-foreground">{selectedMentorForProfile.min_advance_hours} horas de antecedência</strong>.
                  </p>
                </div>

                {selectedMentorForProfile.availability && selectedMentorForProfile.availability.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Disponibilidade
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedMentorForProfile.availability.map((a) => (
                        <span
                          key={a.day}
                          className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full"
                        >
                          {dayLabels[a.day]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <MentorRatingDisplay
                    totalReviews={selectedMentorForProfile.totalReviews}
                    size="md"
                  />
                  {selectedMentorForProfile.totalReviews > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-sm text-primary"
                      onClick={() => {
                        setProfileDialogOpen(false);
                        openReviewsDialog(selectedMentorForProfile);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Ver feedbacks
                    </Button>
                  )}
                </div>

                {/* Share button - only visible to the mentor themselves */}
                {isMentor && currentUserMentorId === selectedMentorForProfile.id && (
                  <div className="mb-4">
                    <MentorShareButton
                      mentorId={selectedMentorForProfile.id}
                      mentorName={selectedMentorForProfile.name}
                      mentorArea={selectedMentorForProfile.area}
                      mentorPhotoUrl={selectedMentorForProfile.photo_url}
                    />
                  </div>
                )}

                <button
                  onClick={() => handleBookFromProfile(selectedMentorForProfile)}
                  className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Agendar mentoria
                </button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Mentors;
