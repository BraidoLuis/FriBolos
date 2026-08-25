import Link from "next/link";

import type {
  Metadata,
} from "next";

import {
  ThemeToggle,
} from "../components/theme-toggle";

export const metadata: Metadata = {
  title: "Política de Privacidade",

  description:
    "Consulte como o FriBolos coleta, utiliza, armazena e protege dados pessoais.",

  alternates: {
    canonical:
      "/politica-de-privacidade",
  },

  openGraph: {
    title:
      "Política de Privacidade | FriBolos",

    description:
      "Informações sobre privacidade e proteção de dados no FriBolos.",

    url:
      "/politica-de-privacidade",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link
          href="/"
          className="legal-brand"
          aria-label="Voltar para o FriBolos"
        >
          <img
            src="/FaviconFribolos.png"
            alt=""
          />

          <span>
            Fri<em>Bolos</em>
          </span>
        </Link>

        <div className="legal-header-actions">
          <Link href="/">
            Início
          </Link>

          <Link href="/catalogo">
            Catálogo
          </Link>

          <ThemeToggle />
        </div>
      </header>

      <section className="legal-hero">
        <p className="eyebrow">
          PRIVACIDADE E PROTEÇÃO DE DADOS
        </p>

        <h1>
          Política de Privacidade
        </h1>

        <p>
          Esta Política explica como o
          FriBolos coleta, utiliza, armazena e
          protege os dados pessoais utilizados
          em nosso site e na prestação dos
          nossos serviços.
        </p>

        <small>
          Última atualização: 25 de agosto de
          2026
        </small>
      </section>

      <div className="legal-layout">
        <aside className="legal-summary">
          <strong>
            Nesta política
          </strong>

          <nav aria-label="Conteúdo da política">
            <a href="#informacoes">
              1. Informações coletadas
            </a>

            <a href="#finalidades">
              2. Como utilizamos os dados
            </a>

            <a href="#compartilhamento">
              3. Compartilhamento
            </a>

            <a href="#armazenamento">
              4. Armazenamento e segurança
            </a>

            <a href="#direitos">
              5. Direitos do titular
            </a>

            <a href="#cookies">
              6. Cookies e tecnologias
            </a>

            <a href="#avaliacoes">
              7. Avaliações
            </a>

            <a href="#alteracoes">
              8. Alterações
            </a>

            <a href="#contato">
              9. Contato
            </a>
          </nav>
        </aside>

        <article className="legal-content">
          <section>
            <h2>Introdução</h2>

            <p>
              O FriBolos respeita a privacidade
              de seus clientes e está
              comprometido com o tratamento
              responsável de dados pessoais, em
              conformidade com a Lei Geral de
              Proteção de Dados Pessoais
              (LGPD — Lei nº 13.709/2018).
            </p>

            <p>
              Ao utilizar o site, criar uma
              conta ou solicitar uma encomenda,
              o usuário declara estar ciente das
              práticas descritas nesta Política.
            </p>
          </section>

          <section id="informacoes">
            <span className="legal-number">
              01
            </span>

            <h2>
              Informações que coletamos
            </h2>

            <p>
              Podemos coletar dados fornecidos
              diretamente pelo usuário durante o
              cadastro, atualização do perfil,
              solicitação de orçamento,
              realização de pedidos, pagamento
              ou envio de avaliações.
            </p>

            <ul>
              <li>
                Nome completo, e-mail, telefone
                e data de nascimento;
              </li>

              <li>
                CEP, endereço, número, bairro,
                cidade e complemento;
              </li>

              <li>
                Informações relacionadas a
                produtos, encomendas,
                personalizações e orçamentos;
              </li>

              <li>
                Datas e horários desejados para
                entrega ou retirada;
              </li>

              <li>
                Avaliações, notas e comentários
                enviados pelo cliente;
              </li>

              <li>
                Informações técnicas básicas,
                como registros de acesso,
                navegador e dispositivo
                utilizado.
              </li>
            </ul>

            <p>
              Dados financeiros completos, como
              o número integral do cartão, são
              processados pelo provedor de
              pagamento responsável e não são
              armazenados diretamente pelo
              FriBolos.
            </p>
          </section>

          <section id="finalidades">
            <span className="legal-number">
              02
            </span>

            <h2>
              Como utilizamos os dados
            </h2>

            <p>
              Os dados pessoais podem ser
              utilizados para:
            </p>

            <ul>
              <li>
                Criar, identificar e proteger a
                conta do usuário;
              </li>

              <li>
                Processar pedidos, encomendas,
                pagamentos e orçamentos;
              </li>

              <li>
                Organizar entregas, retiradas,
                prazos e formas de recebimento;
              </li>

              <li>
                Entrar em contato sobre o
                andamento de uma solicitação;
              </li>

              <li>
                Enviar notificações relacionadas
                à conta e aos pedidos;
              </li>

              <li>
                Prestar suporte e responder a
                dúvidas;
              </li>

              <li>
                Prevenir fraudes, acessos
                indevidos e usos incompatíveis
                com o serviço;
              </li>

              <li>
                Cumprir obrigações legais,
                regulatórias e contratuais;
              </li>

              <li>
                Melhorar a experiência e o
                funcionamento da plataforma.
              </li>
            </ul>
          </section>

          <section id="compartilhamento">
            <span className="legal-number">
              03
            </span>

            <h2>
              Compartilhamento de dados
            </h2>

            <p>
              O FriBolos não comercializa dados
              pessoais. As informações poderão
              ser compartilhadas somente quando
              necessário para o funcionamento do
              serviço, inclusive com provedores
              responsáveis por:
            </p>

            <ul>
              <li>
                Hospedagem e disponibilização do
                site;
              </li>

              <li>
                Banco de dados, autenticação e
                armazenamento de arquivos;
              </li>

              <li>
                Processamento de pagamentos;
              </li>

              <li>
                Envio de notificações e
                comunicações;
              </li>

              <li>
                Atendimento de obrigações legais
                ou determinações de autoridades
                competentes.
              </li>
            </ul>

            <p>
              Esses prestadores recebem somente
              os dados necessários à execução de
              suas respectivas atividades e
              possuem suas próprias políticas de
              privacidade e segurança.
            </p>
          </section>

          <section id="armazenamento">
            <span className="legal-number">
              04
            </span>

            <h2>
              Armazenamento e segurança
            </h2>

            <p>
              Os dados são mantidos pelo período
              necessário para cumprir as
              finalidades descritas nesta
              Política, atender obrigações
              legais, preservar registros de
              pedidos e exercer direitos em
              processos administrativos ou
              judiciais.
            </p>

            <p>
              São adotadas medidas técnicas e
              administrativas razoáveis para
              proteger os dados contra acessos
              não autorizados, perda, alteração,
              divulgação ou destruição.
              Entretanto, nenhum sistema digital
              é completamente imune a riscos.
            </p>

            <p>
              O usuário também é responsável por
              manter sua senha em segurança e
              não compartilhar suas credenciais
              de acesso.
            </p>
          </section>

          <section id="direitos">
            <span className="legal-number">
              05
            </span>

            <h2>
              Direitos do titular
            </h2>

            <p>
              Nos termos da LGPD, o titular
              poderá solicitar, quando
              aplicável:
            </p>

            <ul>
              <li>
                Confirmação da existência de
                tratamento;
              </li>

              <li>
                Acesso aos seus dados pessoais;
              </li>

              <li>
                Correção de dados incompletos,
                inexatos ou desatualizados;
              </li>

              <li>
                Anonimização, bloqueio ou
                eliminação de dados
                desnecessários ou tratados em
                desconformidade;
              </li>

              <li>
                Informação sobre o
                compartilhamento de dados;
              </li>

              <li>
                Portabilidade, quando
                aplicável e conforme
                regulamentação;
              </li>

              <li>
                Revogação do consentimento,
                quando essa for a base legal
                utilizada;
              </li>

              <li>
                Eliminação de dados tratados com
                consentimento, ressalvadas as
                hipóteses legais de conservação.
              </li>
            </ul>

            <p>
              Para proteger o próprio titular,
              poderá ser necessário confirmar
              sua identidade antes de atender
              uma solicitação.
            </p>
          </section>

          <section id="cookies">
            <span className="legal-number">
              06
            </span>

            <h2>
              Cookies e tecnologias semelhantes
            </h2>

            <p>
              O site pode utilizar cookies,
              armazenamento local e tecnologias
              semelhantes necessários para
              manter a sessão do usuário,
              preservar preferências, proteger o
              acesso e permitir o funcionamento
              adequado da plataforma.
            </p>

            <p>
              O bloqueio dessas tecnologias pelo
              navegador poderá comprometer
              recursos como autenticação,
              carrinho, preferências e
              permanência da sessão.
            </p>
          </section>

          <section id="avaliacoes">
            <span className="legal-number">
              07
            </span>

            <h2>
              Avaliações e conteúdo enviado
            </h2>

            <p>
              Avaliações enviadas pelos clientes
              poderão ser exibidas nas páginas
              do FriBolos sem a divulgação do
              nome completo, endereço, telefone,
              e-mail ou outras informações
              pessoais do autor.
            </p>

            <p>
              Comentários ofensivos, ilícitos,
              fraudulentos ou incompatíveis com
              a finalidade da plataforma poderão
              ser removidos.
            </p>
          </section>

          <section id="alteracoes">
            <span className="legal-number">
              08
            </span>

            <h2>
              Alterações nesta Política
            </h2>

            <p>
              Esta Política poderá ser
              atualizada para refletir mudanças
              legais, técnicas ou operacionais.
              A versão mais recente permanecerá
              disponível nesta página com a
              respectiva data de atualização.
            </p>
          </section>

          <section id="contato">
            <span className="legal-number">
              09
            </span>

            <h2>
              Contato
            </h2>

            <p>
              Dúvidas sobre esta Política ou
              solicitações relacionadas a dados
              pessoais poderão ser encaminhadas
              pelos canais de atendimento
              informados no site do FriBolos.
            </p>

            <div className="legal-contact-card">
              <div>
                <strong>
                  Precisa falar conosco?
                </strong>

                <span>
                  Utilize nossos canais oficiais
                  de atendimento.
                </span>
              </div>

              <Link href="/#contato">
                Ver contato
                <span>→</span>
              </Link>
            </div>
          </section>
        </article>
      </div>

      <footer className="legal-footer">
        <Link
          href="/"
          className="legal-brand"
        >
          <img
            src="/FaviconFribolos.png"
            alt=""
          />

          <span>
            Fri<em>Bolos</em>
          </span>
        </Link>

        <p>
          © 2026 FriBolos. Todos os direitos
          reservados.
        </p>

        <Link href="/catalogo">
          Ver catálogo
        </Link>
      </footer>
    </main>
  );
}