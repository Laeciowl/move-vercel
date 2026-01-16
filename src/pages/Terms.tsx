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
            Termos de Uso e Política de Privacidade
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transparência e respeito são a base do nosso projeto. Leia atentamente os termos abaixo para entender como funcionamos.
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
              <h4 className="font-semibold text-foreground mb-2">1. Aceitação dos Termos</h4>
              <p>
                Ao acessar e usar a plataforma Movê, você concorda com estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">2. Descrição do Serviço</h4>
              <p>
                O Movê é um projeto social que oferece educação, mentoria e recursos gratuitos para pessoas 
                em busca de desenvolvimento profissional e pessoal. Todos os serviços são oferecidos 
                voluntariamente e sem fins lucrativos.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">3. Cadastro e Conta</h4>
              <p>
                Para acessar determinados recursos, você precisará criar uma conta. Você é responsável 
                por manter a confidencialidade de suas credenciais e por todas as atividades que ocorram 
                em sua conta. Você deve fornecer informações verdadeiras e atualizadas.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">4. Uso Adequado</h4>
              <p className="mb-2">Você concorda em:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Usar a plataforma apenas para fins legais e educacionais</li>
                <li>Não compartilhar conteúdos ofensivos, discriminatórios ou ilegais</li>
                <li>Respeitar outros usuários, mentores e voluntários</li>
                <li>Não tentar acessar áreas restritas do sistema</li>
                <li>Não usar a plataforma para spam ou atividades comerciais não autorizadas</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">5. Conteúdo dos Usuários</h4>
              <p>
                Ao enviar conteúdo para a plataforma (como materiais de voluntários), você garante que 
                possui os direitos necessários sobre esse conteúdo e concede ao Movê uma licença não 
                exclusiva para usar, exibir e distribuir esse conteúdo para fins educacionais.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">6. Mentorias</h4>
              <p>
                As mentorias são oferecidas por voluntários de forma gratuita e com base em sua 
                disponibilidade. O Movê não garante resultados específicos das mentorias e não se 
                responsabiliza por conselhos ou orientações fornecidas pelos mentores.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">7. Limitação de Responsabilidade</h4>
              <p>
                O Movê é fornecido "como está" e não oferece garantias de disponibilidade contínua 
                ou de que os serviços atenderão às suas expectativas. Não nos responsabilizamos por 
                danos indiretos resultantes do uso da plataforma.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">8. Modificações</h4>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações 
                significativas serão comunicadas através da plataforma. O uso continuado após 
                alterações constitui aceitação dos novos termos.
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
              <h4 className="font-semibold text-foreground mb-2">1. Dados Coletados</h4>
              <p className="mb-2">Coletamos as seguintes informações:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Dados de cadastro:</strong> nome, e-mail, idade, cidade, estado e telefone (opcional)</li>
                <li><strong>Dados de perfil:</strong> situação profissional e descrição pessoal</li>
                <li><strong>Dados de uso:</strong> interações com a plataforma, mentorias agendadas e conteúdos acessados</li>
                <li><strong>Dados técnicos:</strong> informações do navegador e dispositivo para melhorar a experiência</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">2. Finalidade do Tratamento</h4>
              <p className="mb-2">Utilizamos seus dados para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Permitir o acesso e uso da plataforma</li>
                <li>Facilitar o agendamento de mentorias</li>
                <li>Enviar notificações sobre suas atividades</li>
                <li>Melhorar nossos serviços e conteúdos</li>
                <li>Medir o impacto social do projeto</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">3. Base Legal (LGPD)</h4>
              <p>
                O tratamento de seus dados é baseado no seu consentimento explícito, fornecido no 
                momento do cadastro. Você pode revogar esse consentimento a qualquer momento, 
                solicitando a exclusão de sua conta.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">4. Compartilhamento de Dados</h4>
              <p className="mb-2">Seus dados podem ser compartilhados apenas:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Com mentores, apenas as informações necessárias para a mentoria (nome, telefone)</li>
                <li>Com a equipe administrativa do Movê para gestão da plataforma</li>
                <li>Por exigência legal ou ordem judicial</li>
              </ul>
              <p className="mt-2">
                <strong>Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais.</strong>
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">5. Segurança dos Dados</h4>
              <p>
                Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo 
                criptografia, controle de acesso e monitoramento. No entanto, nenhum sistema é 100% 
                seguro, e você deve proteger suas credenciais de acesso.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">6. Seus Direitos</h4>
              <p className="mb-2">De acordo com a LGPD, você tem direito a:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou incorretos</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Revogar o consentimento</li>
                <li>Solicitar portabilidade dos dados</li>
                <li>Obter informações sobre compartilhamento</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">7. Retenção de Dados</h4>
              <p>
                Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para 
                cumprir obrigações legais. Após a exclusão da conta, seus dados serão removidos 
                em até 30 dias, exceto quando houver obrigação legal de retenção.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">8. Cookies</h4>
              <p>
                Utilizamos cookies essenciais para o funcionamento da plataforma e para manter 
                sua sessão ativa. Não utilizamos cookies de rastreamento de terceiros.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">9. Contato</h4>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em 
                contato através do e-mail: <strong>privacidade@move.org.br</strong>
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
              O Movê está comprometido com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). 
              Todos os dados pessoais são tratados com transparência, segurança e respeito aos 
              direitos dos titulares.
            </p>
            <p>
              <strong>Encarregado de Dados (DPO):</strong> Para questões relacionadas à proteção 
              de dados, entre em contato com nosso encarregado através do e-mail 
              <strong> dpo@move.org.br</strong>.
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
            Educação e acolhimento para transformar vidas.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
