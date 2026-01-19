import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft, UserPlus, LogIn, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";

const emailSchema = z.string().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(72);
const phoneSchema = z
  .string()
  .min(10, "Telefone deve ter pelo menos 10 dígitos")
  .max(20, "Telefone muito longo")
  .regex(/^[\d\s()+-]+$/, "Telefone inválido");

type ProfessionalStatus = Enums<"professional_status">;
type IncomeRange = Enums<"income_range">;

const professionalStatusOptions = [
  { value: "desempregado", label: "Desempregado" },
  { value: "estudante", label: "Estudante" },
  { value: "estagiario", label: "Estagiário" },
  { value: "empregado", label: "Empregado" },
  { value: "freelancer_pj", label: "Freelancer / PJ" },
];

type AuthView = "login" | "signup" | "forgot-password" | "reset-password";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const shouldShowSignup = searchParams.get("cadastro") === "true";
  const isPasswordReset = searchParams.get("type") === "recovery";
  
  const [view, setView] = useState<AuthView>(
    isPasswordReset ? "reset-password" : shouldShowSignup ? "signup" : "login"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Login form
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Signup form
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    phone: "",
    professionalStatus: "",
    lgpdConsent: false,
  });

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  
  // Reset password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!authLoading && user && view !== "reset-password") {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate, view]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginData.email);
      passwordSchema.parse(loginData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Entrou! Bora lá 🚀");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(signupData.email);
      passwordSchema.parse(signupData.password);
      phoneSchema.parse(signupData.phone);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (!signupData.name.trim() || !signupData.professionalStatus) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const userAge = parseInt(signupData.age);
    if (isNaN(userAge) || userAge < 18 || userAge > 100) {
      toast.error("Idade deve estar entre 18 e 100 anos");
      return;
    }

    if (!signupData.lgpdConsent) {
      toast.error("Você precisa consentir com o uso dos dados para prosseguir");
      return;
    }

    const cleanPhone = signupData.phone.trim();

    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    try {
      // Sign up with user metadata - profile will be created by database trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: signupData.name.trim(),
            age: userAge,
            city: "N/A",
            state: "N/A",
            professional_status: signupData.professionalStatus,
            income_range: "sem_renda",
            phone: cleanPhone,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Este e-mail já está cadastrado. Faça login.");
        } else if (authError.message.includes("fetch") || authError.message.includes("network")) {
          toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
        } else {
          toast.error(authError.message);
        }
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));
        
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(forgotEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail enviado! Dá uma olhada na sua caixa de entrada.");
      setView("login");
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha nova salva! Agora você já pode usar.");
      navigate("/dashboard");
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

  const getTitle = () => {
    switch (view) {
      case "login":
        return "Entre na sua conta";
      case "signup":
        return "Crie sua conta";
      case "forgot-password":
        return "Recuperar senha";
      case "reset-password":
        return "Definir nova senha";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>

        <div className="bg-card rounded-3xl shadow-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gradient mb-2">Movê</h1>
            <p className="text-muted-foreground">{getTitle()}</p>
          </div>

          {/* Tab Toggle - only show for login/signup */}
          {(view === "login" || view === "signup") && (
            <div className="flex bg-muted rounded-xl p-1 mb-6">
              <button
                onClick={() => setView("login")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                  view === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
              <button
                onClick={() => setView("signup")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                  view === "signup" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar
              </button>
            </div>
          )}

          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="seu@email.com"
                  required
                  maxLength={255}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                    placeholder="••••••••"
                    required
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
              </div>

              <button
                type="button"
                onClick={() => setView("forgot-password")}
                className="text-sm text-primary hover:underline"
              >
                Esqueceu sua senha?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}

          {view === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
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
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
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
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Telefone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={signupData.phone}
                  onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
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
                  value={signupData.age}
                  onChange={(e) => setSignupData({ ...signupData, age: e.target.value })}
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
                  value={signupData.professionalStatus}
                  onChange={(e) => setSignupData({ ...signupData, professionalStatus: e.target.value })}
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
                  checked={signupData.lgpdConsent}
                  onChange={(e) => setSignupData({ ...signupData, lgpdConsent: e.target.checked })}
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
            </form>
          )}

          {view === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Relaxa, acontece! Coloca seu e-mail aqui que a gente manda um link pra você criar uma nova senha.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="seu@email.com"
                  required
                  maxLength={255}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>

              <button
                type="button"
                onClick={() => setView("login")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Voltar ao login
              </button>
            </form>
          )}

          {view === "reset-password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Digite sua nova senha abaixo.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirmar nova senha
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Digite novamente"
                  required
                  minLength={6}
                  maxLength={72}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;