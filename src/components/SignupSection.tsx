import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SignupSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Inscrição enviada com sucesso!");
  };

  if (isSubmitted) {
    return (
      <section id="inscreva-se" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center bg-card p-12 rounded-3xl shadow-card"
          >
            <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Inscrição realizada!
            </h3>
            <p className="text-muted-foreground">
              Obrigado por se inscrever no Movê! Em breve entraremos em contato
              com mais informações sobre as próximas turmas.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="inscreva-se" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Faça parte
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-6">
            Inscreva-se no Movê
          </h2>
          <p className="text-muted-foreground text-lg">
            Preencha o formulário abaixo e dê o primeiro passo para transformar
            seu futuro profissional.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto bg-card p-8 md:p-10 rounded-3xl shadow-card"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                placeholder="Seu nome completo"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                placeholder="seu@email.com"
                required
                maxLength={255}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Telefone / WhatsApp *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                placeholder="(11) 99999-9999"
                required
                maxLength={20}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                Por que você quer participar?
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow resize-none"
                placeholder="Conte um pouco sobre você e seus objetivos..."
                maxLength={500}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-8 bg-gradient-hero text-primary-foreground py-4 rounded-xl font-bold text-lg shadow-button hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar inscrição"
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Ao se inscrever, você concorda com nossa política de privacidade.
          </p>
        </motion.form>
      </div>
    </section>
  );
};

export default SignupSection;
