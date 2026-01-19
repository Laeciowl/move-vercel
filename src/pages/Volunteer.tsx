import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, CheckCircle, Upload, X, Plus, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import MentorDisclaimerModal from "@/components/MentorDisclaimerModal";

const emailSchema = z.string().email("E-mail inválido").max(255);
const nameSchema = z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100);
const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(72, "Senha muito longa")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial (!@#$%^&*)");
const phoneSchema = z
  .string()
  .min(10, "Telefone deve ter pelo menos 10 dígitos")
  .max(20, "Telefone muito longo")
  .regex(/^[\d\s()+-]+$/, "Telefone inválido");

// Availability validation schema for defense-in-depth
const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const availabilityItemSchema = z.object({
  day: z.enum(validDays, { errorMap: () => ({ message: "Dia inválido" }) }),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido")).min(1, "Selecione pelo menos um horário"),
});
const availabilitySchema = z.array(availabilityItemSchema).min(1, "Adicione pelo menos um dia de disponibilidade");
// Voluntários agora são automaticamente mentores e podem contribuir com todo tipo de conteúdo

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
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

interface Availability {
  day: string;
  times: string[];
}


const Volunteer = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || "",
        email: user?.email || "",
      }));
    }
  }, [profile, user]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    area: "",
    // Mentor fields - todos voluntários são mentores
    description: "",
    education: "",
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(false);
  
  // Todos os voluntários são automaticamente mentores
  const isMentorApplication = true;
  
  // Verifica se precisa criar conta (não está logado)
  const needsAccountCreation = !user;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addAvailability = () => {
    setAvailability([...availability, { day: "monday", times: [] }]);
  };

  const removeAvailability = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const updateAvailabilityDay = (index: number, day: string) => {
    const newAvailability = [...availability];
    newAvailability[index].day = day;
    setAvailability(newAvailability);
  };

  const toggleTime = (index: number, time: string) => {
    const newAvailability = [...availability];
    const times = newAvailability[index].times;
    if (times.includes(time)) {
      newAvailability[index].times = times.filter((t) => t !== time);
    } else {
      newAvailability[index].times = [...times, time].sort();
    }
    setAvailability(newAvailability);
  };


  const validateForm = (): boolean => {
    try {
      nameSchema.parse(formData.name);
      emailSchema.parse(formData.email);
      phoneSchema.parse(formData.phone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return false;
      }
    }

    // Validação de senha para quem não está logado
    if (needsAccountCreation) {
      try {
        passwordSchema.parse(formData.password);
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error(error.errors[0].message);
          return false;
        }
      }
    }

    if (!formData.area.trim()) {
      toast.error("Conta pra gente qual é sua área de atuação!");
      return false;
    }

    // Validação de descrição (todos são mentores agora)
    if (!formData.description.trim()) {
      toast.error("Escreve um pouquinho sobre você! Ajuda os mentorados te conhecerem.");
      return false;
    }

    // Validação de disponibilidade usando zod (defesa em profundidade)
    try {
      availabilitySchema.parse(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        if (firstError.path.length === 0) {
          toast.error("Adiciona pelo menos um dia que você pode atender!");
        } else if (firstError.path.includes("times")) {
          toast.error("Seleciona pelo menos um horário pra cada dia marcado!");
        } else {
          toast.error(firstError.message);
        }
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // If it's a mentor application and disclaimer not yet accepted, show modal
    if (isMentorApplication && !disclaimerAccepted) {
      setShowDisclaimerModal(true);
      return;
    }

    await submitApplication();
  };

  const handleDisclaimerAccept = async () => {
    setDisclaimerAccepted(true);
    setShowDisclaimerModal(false);
    await submitApplication();
  };

  const submitApplication = async () => {
    setLoading(true);

    try {
      let currentUserId = user?.id || null;

      // Se não está logado, criar conta primeiro
      if (needsAccountCreation) {
        const redirectUrl = `${window.location.origin}/onboarding-voluntario`;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: formData.name.trim(),
              age: 25, // Default age for volunteers
              city: "N/A",
              state: "N/A",
              professional_status: "empregado",
              income_range: "acima_3000",
              phone: formData.phone.trim(),
            },
          },
        });

        if (authError) {
          if (authError.message.includes("already registered")) {
            toast.error("Este e-mail já está cadastrado. Faça login primeiro.");
          } else {
            toast.error("Erro ao criar conta: " + authError.message);
          }
          setLoading(false);
          return;
        }

        if (authData.user) {
          currentUserId = authData.user.id;
          setCreatedAccount(true);
          // Aguarda um momento para o trigger criar o perfil
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // For logged-in users who are already volunteers (have voluntario role),
      // skip volunteer_applications insert and go directly to mentor registration
      const isExistingVolunteer = currentUserId ? await checkIfVolunteerByUserId(currentUserId) : false;

      if (!isExistingVolunteer) {
        // Insert into volunteer_applications for new volunteers
        const { error: volunteerError } = await supabase
          .from("volunteer_applications")
          .insert({
            name: formData.name.trim(),
            email: formData.email.trim(),
            area: formData.area.trim(),
            how_to_help: "Mentoria, Aulas/Lives, Templates",
            categories: ["mentoria", "aulas_lives", "templates_arquivos"],
            user_id: currentUserId,
          });

        if (volunteerError) {
          // Check if error is due to duplicate entry (user already applied)
          if (volunteerError.code === "23505" || volunteerError.message.includes("duplicate")) {
            console.log("User already has a volunteer application, proceeding with mentor registration");
          } else {
            throw volunteerError;
          }
        }
      }

      // Insert into mentors table
      if (isMentorApplication) {
        let photoUrl: string | null = null;

        // Upload photo if provided
        if (photoFile) {
          const fileExt = photoFile.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("mentor-photos")
            .upload(fileName, photoFile);

          if (uploadError) {
            console.error("Photo upload error:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from("mentor-photos")
              .getPublicUrl(fileName);
            photoUrl = urlData.publicUrl;
          }
        }

        const { error: mentorError } = await supabase.from("mentors").insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          area: formData.area.trim(),
          description: formData.description.trim(),
          education: formData.education.trim() || null,
          photo_url: photoUrl,
          availability: JSON.parse(JSON.stringify(availability)),
          disclaimer_accepted: true,
          disclaimer_accepted_at: new Date().toISOString(),
        }]);

        if (mentorError) {
          console.error("Mentor insert error:", mentorError);
          if (mentorError.code === '23505' || mentorError.message.includes('duplicate')) {
            toast.error("Você já está cadastrado como mentor.");
            setLoading(false);
            return;
          }
          toast.warning("Houve um erro ao criar perfil de mentor: " + mentorError.message);
          setLoading(false);
          return;
        }
      }

      // Send welcome email to volunteer
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            to: formData.email.trim(),
            name: formData.name.trim(),
            type: "volunteer_application_received",
            skipPreferenceCheck: true,
          },
        });
        console.log("Volunteer welcome email sent to:", formData.email);
      } catch (emailError) {
        console.error("Error sending volunteer welcome email:", emailError);
      }

      setSubmitted(true);
      toast.success("Tudo certo! Cadastro enviado. Logo entramos em contato.");
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    }

    setLoading(false);
  };

  const checkIfVolunteerByUserId = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "voluntario")
      .maybeSingle();
    
    return !!data;
  };

  const checkIfVolunteer = async (): Promise<boolean> => {
    if (!user) return false;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "voluntario")
      .maybeSingle();
    
    return !!data;
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card rounded-3xl shadow-card p-10 text-center"
        >
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Que bom ter você no time! 💙
          </h2>
          <p className="text-muted-foreground mb-6">
            Recebemos sua inscrição e estamos muito felizes! 
            Assim que aprovada, você terá acesso à área de voluntários.
          </p>
          {createdAccount && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-green-800">
                <strong>✅ Sua conta foi criada!</strong><br />
                Use o e-mail e senha cadastrados para fazer login quando for aprovado.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {createdAccount ? (
              <button
                onClick={() => navigate("/onboarding-voluntario")}
                className="bg-gradient-hero text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity"
              >
                Continuar para Onboarding
              </button>
            ) : (
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-hero text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity"
              >
                Ir para o Dashboard
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl shadow-card p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Faça parte dessa história</h1>
              <p className="text-muted-foreground">Sua experiência pode mudar uma trajetória</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-8">
            O Movê é construído por gente que acredita que educação é o caminho. 
            Se você já passou por desafios de carreira e quer ajudar quem está começando, 
            vem com a gente. Seu tempo e conhecimento podem fazer uma diferença enorme.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Seu nome completo"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                E-mail *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="seu@email.com"
                required
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Telefone (WhatsApp) *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="(11) 99999-9999"
                required
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para comunicação com a equipe e mentorados.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Área de atuação *
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Ex: Marketing, RH, Tecnologia, Finanças..."
                required
                maxLength={100}
              />
            </div>

            {/* Password field - only for new users */}
            {needsAccountCreation && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Crie uma senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                    placeholder="Mín. 8 caracteres, maiúscula, número e especial"
                    required
                    minLength={8}
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Esta senha será usada para acessar sua conta após aprovação.
                </p>
              </div>
            )}

            {user && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-800">
                  <strong>✅ Você está logado como:</strong> {user.email}
                </p>
              </div>
            )}

            {/* Info box - todos podem fazer tudo */}
            <div className="bg-accent/50 rounded-xl p-4 border border-primary/20">
              <p className="text-sm text-foreground">
                <strong>Como voluntário da Movê, você poderá:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Oferecer mentorias individuais para jovens</li>
                <li>Compartilhar materiais e referências</li>
                <li>Enviar aulas gravadas e conteúdos</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3 italic">
                Após aprovação, você poderá enviar conteúdos diretamente pelo seu painel de voluntário.
              </p>
            </div>


            {/* Mentor-specific fields */}
            {isMentorApplication && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6 pt-6 border-t border-border"
              >
                <div className="bg-accent/50 rounded-xl p-4">
                  <h3 className="font-semibold text-foreground mb-2">
                    🎓 Informações do Mentor
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Preencha os campos abaixo para criar seu perfil de mentor. 
                    Após aprovação, você ficará visível para os participantes agendarem mentorias.
                  </p>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Foto de perfil
                  </label>
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed border-input rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Envie uma foto profissional (máx. 5MB)
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sobre você *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                    placeholder="Conte um pouco sobre sua experiência, o que você faz, e como pode ajudar..."
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.description.length}/500 caracteres
                  </p>
                </div>

                {/* Education */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Formação
                  </label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: MBA em Marketing Digital - USP"
                    maxLength={200}
                  />
                </div>

                {/* Availability */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-foreground">
                      Disponibilidade *
                    </label>
                    <button
                      type="button"
                      onClick={addAvailability}
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar dia
                    </button>
                  </div>

                  {availability.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Adicione os dias e horários em que você está disponível para mentorias.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {availability.map((avail, index) => (
                        <div key={index} className="border border-input rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <select
                              value={avail.day}
                              onChange={(e) => updateAvailabilityDay(index, e.target.value)}
                              className="px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              {dayOptions.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeAvailability(index)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {timeSlots.map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => toggleTime(index, time)}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                  avail.times.includes(time)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-hero text-primary-foreground py-4 rounded-xl font-bold text-lg shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Quero ser voluntário"
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Mentor Disclaimer Modal */}
      <MentorDisclaimerModal
        isOpen={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        onAccept={handleDisclaimerAccept}
      />
    </div>
  );
};

export default Volunteer;