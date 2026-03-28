import { Wrench, Clock, ArrowRight } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-gradient-mesh pointer-events-none" />

      {/* Decorative blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">
        {/* Logo / Brand */}
        <div className="mb-8 flex items-center gap-2">
          <span className="text-2xl font-extrabold text-gradient">
            MoveSocial
          </span>
        </div>

        {/* Icon */}
        <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-hero shadow-button">
          <Wrench className="w-9 h-9 text-white" strokeWidth={2} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3 leading-tight">
          Em manutenção
        </h1>

        {/* Subtext */}
        <p className="text-muted-foreground text-base sm:text-lg mb-8 leading-relaxed">
          Estamos aprimorando a plataforma para oferecer uma experiência ainda
          melhor. Voltaremos em breve!
        </p>

        {/* Status badge */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent border border-primary/20 text-accent-foreground text-sm font-medium mb-8">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          Trabalhando para voltar logo
        </div>

        {/* Info card */}
        <div className="w-full rounded-2xl border border-border bg-card shadow-card p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
              <Clock className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">
                Previsão de retorno
              </p>
              <p className="text-sm text-muted-foreground">
                A plataforma estará disponível novamente em breve. Agradecemos a
                sua paciência.
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Dúvidas? Entre em contato:
            </p>
            <a
              href="mailto:contato@movesocial.com.br"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              movecarreiras@gmail.com
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
