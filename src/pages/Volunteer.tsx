import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("E-mail inválido").max(255);
const nameSchema = z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100);

const helpOptions = [
  { value: "conteudo", label: "Criar conteúdo (vídeos, artigos, PDFs)" },
  { value: "mentoria", label: "Mentoria individual" },
  { value: "aulas_ao_vivo", label: "Aulas ao vivo / Workshops" },
  { value: "revisao_curriculo", label: "Revisão de currículo" },
  { value: "revisao_linkedin", label: "Revisão de LinkedIn" },
  { value: "outro", label: "Outro" },
];

const Volunteer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    area: "",
    howToHelp: [] as string[],
    otherHelp: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleHelpToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      howToHelp: prev.howToHelp.includes(value)
        ? prev.howToHelp.filter((v) => v !== value)
        : [...prev.howToHelp, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      nameSchema.parse(formData.name);
      emailSchema.parse(formData.email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (!formData.area.trim()) {
      toast.error("Por favor, informe sua área de atuação");
      return;
    }

    if (formData.howToHelp.length === 0) {
      toast.error("Por favor, selecione como gostaria de ajudar");
      return;
    }

    setLoading(true);

    const howToHelpText = formData.howToHelp
      .map((value) => {
        if (value === "outro") {
          return formData.otherHelp || "Outro";
        }
        return helpOptions.find((o) => o.value === value)?.label || value;
      })
      .join(", ");

    const { error } = await supabase.from("volunteer_applications").insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      area: formData.area.trim(),
      how_to_help: howToHelpText,
    });

    if (error) {
      toast.error("Erro ao enviar: " + error.message);
    } else {
      setSubmitted(true);
      toast.success("Aplicação enviada com sucesso!");
    }

    setLoading(false);
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
            Obrigado por querer ajudar! 💙
          </h2>
          <p className="text-muted-foreground mb-8">
            Recebemos sua inscrição como voluntário. Em breve entraremos em contato
            para alinhar como você pode contribuir com o projeto Movê.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-hero text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-button hover:opacity-90 transition-opacity"
          >
            Voltar ao início
          </button>
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
              <h1 className="text-2xl font-bold text-foreground">Seja um Voluntário</h1>
              <p className="text-muted-foreground">Ajude a transformar vidas</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-8">
            O Movê é feito por pessoas que acreditam no poder da educação. 
            Se você quer compartilhar seu conhecimento e fazer a diferença na vida de jovens 
            brasileiros, junte-se a nós como voluntário.
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Como você gostaria de ajudar? *
              </label>
              <div className="space-y-2">
                {helpOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.howToHelp.includes(option.value)
                        ? "border-primary bg-accent"
                        : "border-input hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.howToHelp.includes(option.value)}
                      onChange={() => handleHelpToggle(option.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.howToHelp.includes(option.value)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {formData.howToHelp.includes(option.value) && (
                        <CheckCircle className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>

              {formData.howToHelp.includes("outro") && (
                <input
                  type="text"
                  value={formData.otherHelp}
                  onChange={(e) => setFormData({ ...formData, otherHelp: e.target.value })}
                  className="mt-3 w-full px-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Descreva como gostaria de ajudar..."
                  maxLength={200}
                />
              )}
            </div>

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
    </div>
  );
};

export default Volunteer;
