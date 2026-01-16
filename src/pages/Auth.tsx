import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowLeft, UserPlus, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import type { Enums } from "@/integrations/supabase/types";

const emailSchema = z.string().email("E-mail inválido").max(255);
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(72);

type ProfessionalStatus = Enums<"professional_status">;
type IncomeRange = Enums<"income_range">;

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const professionalStatusOptions = [
  { value: "desempregado", label: "Desempregado" },
  { value: "estudante", label: "Estudante" },
  { value: "estagiario", label: "Estagiário" },
  { value: "empregado", label: "Empregado" },
  { value: "freelancer_pj", label: "Freelancer / PJ" },
];

const incomeRangeOptions = [
  { value: "sem_renda", label: "Sem renda" },
  { value: "ate_1500", label: "Até R$ 1.500" },
  { value: "1500_3000", label: "R$ 1.500 – R$ 3.000" },
  { value: "acima_3000", label: "Acima de R$ 3.000" },
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
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
    city: "",
    state: "",
    professionalStatus: "",
    incomeRange: "",
    lgpdConsent: false,
  });

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

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
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(signupData.email);
      passwordSchema.parse(signupData.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (!signupData.name.trim() || !signupData.city.trim() || !signupData.state || 
        !signupData.professionalStatus || !signupData.incomeRange) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const age = parseInt(signupData.age);
    if (isNaN(age) || age < 18 || age > 100) {
      toast.error("Idade deve estar entre 18 e 100 anos");
      return;
    }

    if (!signupData.lgpdConsent) {
      toast.error("Você precisa consentir com o uso dos dados para prosseguir");
      return;
    }

    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        toast.error("Este e-mail já está cadastrado. Faça login.");
      } else {
        toast.error(authError.message);
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        name: signupData.name.trim(),
        age: age,
        city: signupData.city.trim(),
        state: signupData.state,
        professional_status: signupData.professionalStatus as ProfessionalStatus,
        income_range: signupData.incomeRange as IncomeRange,
        lgpd_consent: true,
        lgpd_consent_at: new Date().toISOString(),
      });

      if (profileError) {
        toast.error("Erro ao criar perfil: " + profileError.message);
        setLoading(false);
        return;
      }

      toast.success("Cadastro realizado com sucesso!");
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
            <p className="text-muted-foreground">
              {isLogin ? "Entre na sua conta" : "Crie sua conta"}
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                isLogin ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
                !isLogin ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar
            </button>
          </div>

          {isLogin ? (
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
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-hero text-primary-foreground py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
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

              <div className="grid grid-cols-2 gap-4">
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
                    Estado *
                  </label>
                  <select
                    value={signupData.state}
                    onChange={(e) => setSignupData({ ...signupData, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">Selecione</option>
                    {brazilianStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={signupData.city}
                  onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Sua cidade"
                  required
                  maxLength={100}
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Faixa de renda mensal *
                </label>
                <select
                  value={signupData.incomeRange}
                  onChange={(e) => setSignupData({ ...signupData, incomeRange: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                >
                  <option value="">Selecione</option>
                  {incomeRangeOptions.map((option) => (
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
                  Autorizo o uso dos meus dados de forma agregada e anônima para fins de
                  pesquisa e mensuração de impacto social, conforme a LGPD. *
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
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
