import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-12">
          <div className="max-w-sm">
            <h3 className="text-3xl font-bold text-gradient mb-4">Movê</h3>
            <p className="text-background/60 leading-relaxed">
              Um projeto social que acredita no potencial de cada pessoa. 
              Educação que move.
            </p>
            <p className="text-background/40 text-sm mt-4">
              Projeto fundado por{" "}
              <a 
                href="https://www.linkedin.com/in/laecio-rodrigues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Laécio Oliveira
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-12">
            <div>
              <h4 className="font-semibold mb-4 text-background/80">Navegação</h4>
              <ul className="space-y-3 text-background/60">
                <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
                <li><Link to="/mentores" className="hover:text-primary transition-colors">Mentores</Link></li>
                <li><Link to="/voluntario" className="hover:text-primary transition-colors">Seja Voluntário</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-background/80">Acesso</h4>
              <ul className="space-y-3 text-background/60">
                <li><Link to="/auth" className="hover:text-primary transition-colors">Entrar</Link></li>
                <li><Link to="/auth?cadastro=true" className="hover:text-primary transition-colors">Criar conta</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-background/80">Legal</h4>
              <ul className="space-y-3 text-background/60">
                <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                <li><Link to="/termos" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/40 text-sm">
            © {new Date().getFullYear()} Movê. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2 text-background/40 text-sm">
            <span>Feito com</span>
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span>para a comunidade</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
