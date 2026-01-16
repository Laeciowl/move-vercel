import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, FileText, Lock, Users, Scale } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Termos Legais</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Intro Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Nosso compromisso com você
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Aqui na Movê, acreditamos que transparência é a base de qualquer relação de confiança. 
            Por isso, escrevemos esses termos de forma clara e direta, sem juridiquês desnecessário.
          </p>
        </motion.div>

        {/* Terms of Use */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Termos de Uso</h3>
          </div>

          <div className="space-y-6 text-foreground/80 leading-relaxed">
            <div>
              <h4 className="font-semibold text-foreground mb-2">1. Bem-vindo à Movê!</h4>
              <p>
                Ao usar nossa plataforma, você concorda com estas regras. Elas existem para garantir 
                um ambiente seguro e respeitoso para todos. Se algo não fizer sentido, fale com a gente!
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">2. O que fazemos</h4>
              <p>
                Movê é um projeto social criado com amor e propósito. Oferecemos educação, mentoria e 
                recursos gratuitos para ajudar você a dar os próximos passos na sua carreira. Tudo isso 
                é feito por voluntários que acreditam no poder da educação para transformar vidas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">3. Sua conta é sua responsabilidade</h4>
              <p>
                Quando você cria uma conta, a senha é só sua. Guarde ela bem! Também pedimos que você 
                coloque informações verdadeiras – isso ajuda nossos mentores a te conhecerem melhor 
                e oferecerem orientações mais personalizadas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">4. Regras de convivência</h4>
              <p className="mb-2">Para manter nossa comunidade saudável, pedimos que você:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Trate todos com respeito – somos uma comunidade diversa</li>
                <li>Não compartilhe conteúdos ofensivos ou discriminatórios</li>
                <li>Use a plataforma para aprender e crescer, não para spam</li>
                <li>Respeite o tempo dos nossos mentores voluntários</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">5. Conteúdos que você compartilha</h4>
              <p>
                Se você enviar materiais para a plataforma (como aulas ou templates), você garante 
                que tem direito sobre eles. Ao enviar, você nos autoriza a compartilhar com a 
                comunidade para fins educacionais. Simples assim!
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">6. Sobre as mentorias</h4>
              <p>
                Nossos mentores são pessoas incríveis que doam seu tempo para ajudar você. As 
                orientações são baseadas em suas experiências pessoais e profissionais. Cada 
                jornada é única, então use as mentorias como inspiração para construir a sua!
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">7. Somos humanos</h4>
              <p>
                Movê é feita por pessoas reais, com muito amor, mas também com limitações. Fazemos 
                o nosso melhor para manter tudo funcionando, mas imprevistos acontecem. Se algo 
                der errado, conte com a gente para resolver juntos.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">8. Podemos atualizar</h4>
              <p>
                Se precisarmos mudar alguma coisa aqui, vamos te avisar. Continuando a usar a 
                plataforma, você concorda com as mudanças. Prometemos não inventar moda!
              </p>
            </div>
          </div>
        </motion.section>

        {/* Privacy Policy */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Política de Privacidade</h3>
          </div>

          <div className="space-y-6 text-foreground/80 leading-relaxed">
            <div>
              <h4 className="font-semibold text-foreground mb-2">1. O que guardamos sobre você</h4>
              <p className="mb-2">Para te conhecer melhor e oferecer uma experiência personalizada, guardamos:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Seus dados básicos:</strong> nome, e-mail, idade, cidade e estado</li>
                <li><strong>Seu perfil:</strong> situação profissional e uma descrição sobre você</li>
                <li><strong>Sua jornada:</strong> mentorias que você fez e conteúdos que acessou</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">2. Por que usamos seus dados</h4>
              <p className="mb-2">Usamos essas informações para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Conectar você aos mentores certos</li>
                <li>Avisar sobre suas mentorias e novidades</li>
                <li>Melhorar a plataforma baseado no seu feedback</li>
                <li>Medir quantas vidas estamos impactando (isso nos motiva!)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">3. Você está no controle</h4>
              <p>
                Você escolheu se cadastrar e pode mudar de ideia quando quiser. Quer sair? 
                Só pedir que a gente apaga tudo. Sem ressentimentos, prometemos!
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">4. Com quem compartilhamos</h4>
              <p className="mb-2">Seus dados só são vistos por:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Seu mentor, para poder te ajudar melhor</li>
                <li>Nossa equipe, para manter tudo funcionando</li>
                <li>Autoridades, se for obrigação legal (esperamos que nunca!)</li>
              </ul>
              <p className="mt-2">
                <strong>Nunca, jamais, em hipótese alguma venderemos seus dados. Isso é sagrado para nós.</strong>
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">5. Segurança é prioridade</h4>
              <p>
                Usamos criptografia e boas práticas para proteger seus dados. Mas lembre-se: 
                sua senha é sua responsabilidade. Escolha uma boa e não compartilhe com ninguém!
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">6. Seus direitos</h4>
              <p className="mb-2">Você pode a qualquer momento:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Ver e corrigir seus dados</li>
                <li>Pedir para apagar tudo</li>
                <li>Mudar de ideia sobre participar</li>
                <li>Perguntar qualquer coisa sobre seus dados</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">7. Por quanto tempo guardamos</h4>
              <p>
                Seus dados ficam com a gente enquanto você tiver conta. Se você sair, apagamos 
                tudo em até 30 dias. Só guardamos o que a lei obriga (chato, mas necessário).
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">8. Cookies? Só os essenciais</h4>
              <p>
                Usamos cookies só para manter você logado. Nada de rastreamento chato ou 
                vender suas informações para anúncios. Prometemos!
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">9. Fale com a gente</h4>
              <p>
                Dúvidas? Preocupações? Quer só bater um papo? Manda um e-mail para 
                <strong> contato@moveplataforma.com.br</strong> que a gente responde!
              </p>
            </div>
          </div>
        </motion.section>

        {/* LGPD Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">Conformidade com a LGPD</h3>
          </div>

          <div className="space-y-4 text-foreground/80 leading-relaxed">
            <p>
              Levamos a LGPD (Lei Geral de Proteção de Dados) muito a sério. Não é só porque 
              é lei, mas porque acreditamos que seus dados são seus e ponto final.
            </p>
            <p>
              <strong>Responsável pelos dados:</strong> Qualquer dúvida sobre proteção de dados, 
              manda um e-mail para <strong>contato@moveplataforma.com.br</strong>.
            </p>
          </div>
        </motion.section>

        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground"
        >
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </motion.div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-card border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <Link to="/" className="text-2xl font-bold text-gradient">Movê</Link>
          <p className="text-muted-foreground text-sm mt-2">
            Educação que move.
          </p>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-muted-foreground text-xs">
              Projeto fundado e mantido por{" "}
              <a 
                href="https://www.linkedin.com/in/laécio-oliveira" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Laécio Oliveira
              </a>
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Interessados podem entrar em contato pelo LinkedIn.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
