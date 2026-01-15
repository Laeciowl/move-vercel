import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-2">Movê</h3>
            <p className="text-secondary-foreground/70 text-sm">
              Educação que transforma vidas.
            </p>
          </div>

          <div className="flex items-center gap-2 text-secondary-foreground/70 text-sm">
            <span>Feito com</span>
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span>para a comunidade</span>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-8 pt-8 text-center">
          <p className="text-secondary-foreground/50 text-sm">
            © {new Date().getFullYear()} Movê. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
