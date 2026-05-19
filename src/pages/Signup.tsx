import { useState, useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import logoMove from "@/assets/logo-move.png";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import UserTypeSelector, { UserType } from "@/components/UserTypeSelector";
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

type ProfessionalStatus = Enums<"professional_status">;

const professionalStatusOptions = [
  { value: "desempregado", label: "Desempregado" },
  { value: "estudante", label: "Estudante" },
  { value: "estagiario", label: "Estagiário" },
  { value: "empregado", label: "Empregado" },
  { value: "freelancer_pj", label: "Freelancer / PJ" },
];

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("tipo") === "mentorado" ? "mentee" : null;

  const { user, loading: authLoading } = useAuth();

  const [userType, setUserType] = useState<UserType>(initialType);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Common fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    emailConfirm: "",
    password: "",
    phone: "",
    phoneConfirm: "",
  });

  // Mentee specific fields (simplified — only professional status + LGPD)
  const [menteeData, setMenteeData] = useState({
    professionalStatus: "",
    lgpdConsent: false,
  });

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/inicio");
    }
  }, [user, authLoading, navigate]);

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

  const handleMenteeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMenteeForm()) return;

    setLoading(true);

    const redirectUrl = `${window.location.origin}/inicio`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: formData.name.trim(),
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

        // Process referral code if present
        const refCode = searchParams.get("ref");
        if (refCode) {
          try {
            await supabase.rpc("process_referral_on_signup", {
              ref_code: refCode,
              new_user_id: authData.user.id,
            });
          } catch (e) {
            console.error("Error processing referral:", e);
          }
        }

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
        navigate("/inicio");
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (searchParams.get("tipo") === "mentor") {
    return <Navigate to="/voluntario" replace />;
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
            <img src={logoMove} alt="Movê" className="h-10 w-auto mx-auto mb-2" />
            <p className="text-muted-foreground">
              {userType === "mentee" ? "Cadastro de Mentorado" : "Crie sua conta"}
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
                <UserTypeSelector
                  selectedType={userType}
                  onSelect={(type) => {
                    if (type === "mentor") {
                      navigate("/voluntario");
                    } else {
                      setUserType(type);
                    }
                  }}
                />
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
                    Confirme seu telefone *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneConfirm}
                    onChange={(e) => setFormData({ ...formData, phoneConfirm: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      formData.phoneConfirm && formData.phone.replace(/\D/g, '') !== formData.phoneConfirm.replace(/\D/g, '')
                        ? "border-destructive"
                        : "border-input"
                    }`}
                    placeholder="Digite o telefone novamente"
                    required
                    maxLength={20}
                  />
                  {formData.phoneConfirm && formData.phone.replace(/\D/g, '') !== formData.phoneConfirm.replace(/\D/g, '') && (
                    <p className="text-xs text-destructive mt-1">Os telefones não coincidem</p>
                  )}
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

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
