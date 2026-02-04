import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, CheckCircle, Upload, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import UserTypeSelector, { UserType } from "@/components/UserTypeSelector";
import MentorDisclaimerModal from "@/components/MentorDisclaimerModal";
import type { Enums } from "@/integrations/supabase/types";

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

// Availability validation schema
const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const availabilityItemSchema = z.object({
  day: z.enum(validDays, { errorMap: () => ({ message: "Dia inválido" }) }),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido")).min(1, "Selecione pelo menos um horário"),
});
const availabilitySchema = z.array(availabilityItemSchema).min(1, "Adicione pelo menos um dia de disponibilidade");

type ProfessionalStatus = Enums<"professional_status">;

const professionalStatusOptions = [
  { value: "desempregado", label: "Desempregado" },
  { value: "estudante", label: "Estudante" },
  { value: "estagiario", label: "Estagiário" },
  { value: "empregado", label: "Empregado" },
  { value: "freelancer_pj", label: "Freelancer / PJ" },
];

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

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("tipo") === "mentor" ? "mentor" : 
                      searchParams.get("tipo") === "mentorado" ? "mentee" : null;
  
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userType, setUserType] = useState<UserType>(initialType);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Common fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    emailConfirm: "",
    password: "",
    phone: "",
    phoneConfirm: "",
  });

  // Mentee specific fields
  const [menteeData, setMenteeData] = useState({
    age: "",
    professionalStatus: "",
    lgpdConsent: false,
  });

  // Mentor specific fields
  const [mentorData, setMentorData] = useState({
    area: "",
    description: "",
    education: "",
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  useEffect(() => {
    // Don't redirect if we're in the middle of a mentor signup flow
    if (!authLoading && user && !submitted && userType !== "mentor") {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate, submitted, userType]);

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

  const validateMenteeForm = (): boolean => {
    try {
      nameSchema.parse(formData.name);
      emailSchema.parse(formData.email);
      passwordSchema.parse(formData.password);
      phoneSchema.parse(formData.phone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return false;
      }
    }

    // Validate email confirmation
    if (formData.email.trim().toLowerCase() !== formData.emailConfirm.trim().toLowerCase()) {
      toast.error("Os e-mails não coincidem. Por favor, verifique.");
      return false;
    }

    // Validate phone confirmation
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    if (normalizePhone(formData.phone) !== normalizePhone(formData.phoneConfirm)) {
      toast.error("Os telefones não coincidem. Por favor, verifique.");
      return false;
    }

    const userAge = parseInt(menteeData.age);
    if (isNaN(userAge) || userAge < 18 || userAge > 100) {
      toast.error("Idade deve estar entre 18 e 100 anos");
      return false;
    }

    if (!menteeData.professionalStatus) {
      toast.error("Selecione sua situação profissional");
      return false;
    }

    if (!menteeData.lgpdConsent) {
      toast.error("Você precisa consentir com o uso dos dados para prosseguir");
      return false;
    }

    return true;
  };

  const validateMentorForm = (): boolean => {
    try {
      nameSchema.parse(formData.name);
      emailSchema.parse(formData.email);
      passwordSchema.parse(formData.password);
      phoneSchema.parse(formData.phone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return false;
      }
    }

    // Validate email confirmation
    if (formData.email.trim().toLowerCase() !== formData.emailConfirm.trim().toLowerCase()) {
      toast.error("Os e-mails não coincidem. Por favor, verifique.");
      return false;
    }

    // Validate phone confirmation
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '');
    if (normalizePhone(formData.phone) !== normalizePhone(formData.phoneConfirm)) {
      toast.error("Os telefones não coincidem. Por favor, verifique.");
      return false;
    }

    if (!mentorData.area.trim()) {
      toast.error("Conta pra gente qual é sua área de atuação!");
      return false;
    }

    if (!mentorData.description.trim()) {
      toast.error("Escreve um pouquinho sobre você! Ajuda os mentorados te conhecerem.");
      return false;
    }

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

  const handleMenteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMenteeForm()) return;

    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: formData.name.trim(),
            age: parseInt(menteeData.age),
            city: "N/A",
            state: "N/A",
            professional_status: menteeData.professionalStatus,
            income_range: "sem_renda",
            phone: formData.phone.trim(),
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Este e-mail já está cadastrado. Faça login.");
        } else if (authError.message.includes("weak") || authError.message.includes("easy to guess")) {
          toast.error("Esta senha foi encontrada em vazamentos de dados. Por favor, crie uma senha mais única.");
        } else if (authError.message.includes("fetch") || authError.message.includes("network")) {
          toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
        } else {
          toast.error(authError.message);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              to: formData.email,
              name: formData.name.trim(),
              type: "registration_confirmation",
              skipPreferenceCheck: true,
            },
          });
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
        }

        try {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              to: "admin@movecarreiras.org",
              name: formData.name.trim(),
              type: "new_user_admin_notification",
              data: {
                email: formData.email,
                city: "N/A",
                state: "N/A",
              },
              skipPreferenceCheck: true,
            },
          });
        } catch (emailError) {
          console.error("Error sending admin notification:", emailError);
        }
        
        toast.success("Pronto! Sua conta foi criada 🎉");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.message?.includes("fetch") || error.name === "TypeError") {
        toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      } else {
        toast.error("Ocorreu um erro ao criar sua conta. Tente novamente.");
      }
    }
    
    setLoading(false);
  };

  const handleMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMentorForm()) return;

    if (!disclaimerAccepted) {
      setShowDisclaimerModal(true);
      return;
    }

    await submitMentorApplication();
  };

  const handleDisclaimerAccept = async () => {
    setDisclaimerAccepted(true);
    setShowDisclaimerModal(false);
    await submitMentorApplication();
  };

  const submitMentorApplication = async () => {
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/onboarding-voluntario`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: formData.name.trim(),
            age: 25,
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
        await new Promise(resolve => setTimeout(resolve, 500));

        // Insert into volunteer_applications
        const { error: volunteerError } = await supabase
          .from("volunteer_applications")
          .insert({
            name: formData.name.trim(),
            email: formData.email.trim(),
            area: mentorData.area.trim(),
            how_to_help: "Mentoria, Aulas/Lives, Templates",
            categories: ["mentoria", "aulas_lives", "templates_arquivos"],
            user_id: authData.user.id,
          });

        if (volunteerError && !volunteerError.message.includes("duplicate")) {
          console.error("Volunteer application error:", volunteerError);
        }

        // Upload photo if provided
        let photoUrl: string | null = null;
        if (photoFile) {
          const fileExt = photoFile.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("mentor-photos")
            .upload(fileName, photoFile);

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("mentor-photos")
              .getPublicUrl(fileName);
            photoUrl = urlData.publicUrl;
          }
        }

        // Insert into mentors table
        const { error: mentorError } = await supabase.from("mentors").insert([{
          name: formData.name.trim(),
          email: formData.email.trim(),
          area: mentorData.area.trim(),
          description: mentorData.description.trim(),
          education: mentorData.education.trim() || null,
          photo_url: photoUrl,
          availability: JSON.parse(JSON.stringify(availability)),
          disclaimer_accepted: true,
          disclaimer_accepted_at: new Date().toISOString(),
        }]);

        if (mentorError) {
          if (mentorError.code === '23505' || mentorError.message.includes('duplicate')) {
            toast.error("Você já está cadastrado como mentor.");
          } else {
            toast.warning("Houve um erro ao criar perfil de mentor: " + mentorError.message);
          }
          setLoading(false);
          return;
        }

        try {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              to: formData.email.trim(),
              name: formData.name.trim(),
              type: "mentor_application_received",
              data: {
                area: mentorData.area.trim(),
              },
              skipPreferenceCheck: true,
            },
          });
        } catch (emailError) {
          console.error("Error sending mentor application email:", emailError);
        }

        setSubmitted(true);
        toast.success("Tudo certo! Cadastro enviado. Logo entramos em contato.");
      }
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted && userType === "mentor") {
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
          <div className="bg-accent border border-border rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-accent-foreground">
              <strong>✅ Sua conta foi criada!</strong><br />
              Use o e-mail e senha cadastrados para fazer login quando for aprovado.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/onboarding-voluntario")}
              className="bg-gradient-hero text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity"
            >
              Continuar para Onboarding
            </button>
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
      <div className="container mx-auto max-w-lg">
        <button
          onClick={() => userType ? setUserType(null) : navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {userType ? "Mudar tipo de cadastro" : "Voltar ao início"}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl shadow-card p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">Movê</h1>
            <p className="text-muted-foreground">
              {userType === "mentee" ? "Cadastro de Mentorado" :
               userType === "mentor" ? "Cadastro de Mentor Voluntário" :
               "Crie sua conta"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!userType && (
              <motion.div
                key="selector"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <UserTypeSelector selectedType={userType} onSelect={setUserType} />
              </motion.div>
            )}

            {userType === "mentee" && (
              <motion.form
                key="mentee-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleMenteeSubmit}
                className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
              >
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
                    Confirme seu e-mail *
                  </label>
                  <input
                    type="email"
                    value={formData.emailConfirm}
                    onChange={(e) => setFormData({ ...formData, emailConfirm: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      formData.emailConfirm && formData.email.trim().toLowerCase() !== formData.emailConfirm.trim().toLowerCase()
                        ? "border-destructive"
                        : "border-input"
                    }`}
                    placeholder="Digite o e-mail novamente"
                    required
                    maxLength={255}
                  />
                  {formData.emailConfirm && formData.email.trim().toLowerCase() !== formData.emailConfirm.trim().toLowerCase() && (
                    <p className="text-xs text-destructive mt-1">Os e-mails não coincidem</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Senha *
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
                  <PasswordStrengthIndicator password={formData.password} />
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
                    Será usado para mentores entrarem em contato com você.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Idade *
                  </label>
                  <input
                    type="number"
                    value={menteeData.age}
                    onChange={(e) => setMenteeData({ ...menteeData, age: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: 25"
                    min={18}
                    max={100}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Situação profissional atual *
                  </label>
                  <select
                    value={menteeData.professionalStatus}
                    onChange={(e) => setMenteeData({ ...menteeData, professionalStatus: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">Selecione</option>
                    {professionalStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start gap-3 p-4 bg-accent rounded-xl">
                  <input
                    type="checkbox"
                    id="lgpd"
                    checked={menteeData.lgpdConsent}
                    onChange={(e) => setMenteeData({ ...menteeData, lgpdConsent: e.target.checked })}
                    className="mt-1"
                    required
                  />
                  <label htmlFor="lgpd" className="text-sm text-accent-foreground">
                    Aceito que meus dados sejam usados de forma anônima pra gente medir o impacto 
                    do projeto e melhorar cada vez mais. Prometemos cuidar bem! *
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? "Cadastrando..." : "Criar conta"}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="text-primary hover:underline font-medium"
                  >
                    Faça login
                  </button>
                </p>
              </motion.form>
            )}

            {userType === "mentor" && (
              <motion.form
                key="mentor-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleMentorSubmit}
                className="space-y-6 max-h-[60vh] overflow-y-auto pr-2"
              >
                {/* Photo upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Foto de perfil (recomendado)
                  </label>
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-20 h-20 rounded-xl object-cover"
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
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-input flex items-center justify-center hover:border-primary transition-colors"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      Máx. 5MB. Ajuda os mentorados te conhecerem!
                    </p>
                  </div>
                </div>

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
                    Senha *
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
                  <PasswordStrengthIndicator password={formData.password} />
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Área de atuação *
                  </label>
                  <input
                    type="text"
                    value={mentorData.area}
                    onChange={(e) => setMentorData({ ...mentorData, area: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: Tecnologia, Marketing, Finanças..."
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Formação (opcional)
                  </label>
                  <input
                    type="text"
                    value={mentorData.education}
                    onChange={(e) => setMentorData({ ...mentorData, education: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: Graduação em Administração, MBA em Marketing..."
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sobre você *
                  </label>
                  <textarea
                    value={mentorData.description}
                    onChange={(e) => setMentorData({ ...mentorData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
                    placeholder="Conta um pouco da sua trajetória e como você pode ajudar..."
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {mentorData.description.length}/500 caracteres
                  </p>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Disponibilidade para mentorias *
                  </label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Em quais dias e horários você pode atender?
                  </p>
                  
                  {availability.map((avail, index) => (
                    <div key={index} className="mb-4 p-4 bg-accent rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <select
                          value={avail.day}
                          onChange={(e) => updateAvailabilityDay(index, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          {dayOptions.map((day) => (
                            <option key={day.value} value={day.value}>{day.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeAvailability(index)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
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
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              avail.times.includes(time)
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addAvailability}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar dia
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {loading ? "Enviando..." : "Enviar candidatura"}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="text-primary hover:underline font-medium"
                  >
                    Faça login
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <MentorDisclaimerModal
        isOpen={showDisclaimerModal}
        onClose={() => setShowDisclaimerModal(false)}
        onAccept={handleDisclaimerAccept}
      />
    </div>
  );
};

export default Signup;
