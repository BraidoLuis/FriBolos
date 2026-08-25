import Link from "next/link";

import type {
  Metadata,
} from "next";

import {
  ThemeToggle,
} from "../components/theme-toggle";

export const metadata: Metadata = {
  title: "Termos de Uso",

  description:
    "Consulte as condições de utilização da plataforma e dos serviços oferecidos pelo FriBolos.",

  alternates: {
    canonical: "/termos-de-uso",
  },

  openGraph: {
    title: "Termos de Uso | FriBolos",

    description:
      "Condições para utilização da plataforma, pedidos e encomendas FriBolos.",

    url: "/termos-de-uso",
  },
};

export default function TermsOfUsePage() {
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
          REGRAS DE UTILIZAÇÃO
        </p>

        <h1>Termos de Uso</h1>

        <p>
          Estes Termos estabelecem as regras
          para utilização da plataforma
          FriBolos, criação de conta,
          solicitação de orçamentos e
          realização de encomendas.
        </p>

        <small>
          Última atualização: 25 de agosto de
          2026
        </small>
      </section>

      <div className="legal-layout">
        <aside className="legal-summary">
          <strong>
            Nestes termos
          </strong>

          <nav aria-label="Conteúdo dos termos">
            <a href="#aceitacao">
              1. Aceitação
            </a>

            <a href="#cadastro">
              2. Cadastro e acesso
            </a>

            <a href="#produtos">
              3. Produtos e catálogo
            </a>

            <a href="#pedidos">
              4. Pedidos e encomendas
            </a>

            <a href="#orcamentos">
              5. Orçamentos
            </a>

            <a href="#pagamentos">
              6. Pagamentos
            </a>

            <a href="#entrega">
              7. Entrega e retirada
            </a>

            <a href="#cancelamentos">
              8. Cancelamentos
            </a>

            <a href="#avaliacoes">
              9. Avaliações
            </a>

            <a href="#responsabilidades">
              10. Responsabilidades
            </a>

            <a href="#privacidade">
              11. Privacidade
            </a>

            <a href="#alteracoes">
              12. Alterações
            </a>

            <a href="#contato">
              13. Contato
            </a>
          </nav>
        </aside>

        <article className="legal-content">
          <section>
            <h2>Introdução</h2>

            <p>
              Estes Termos de Uso regulam o
              acesso e a utilização do site e
              dos serviços digitais do
              FriBolos.
            </p>

            <p>
              A plataforma permite consultar
              produtos, criar uma conta,
              solicitar orçamentos, realizar
              encomendas, acompanhar pedidos,
              efetuar pagamentos e enviar
              avaliações.
            </p>
          </section>

          <section id="aceitacao">
            <span className="legal-number">
              01
            </span>

            <h2>
              Aceitação dos Termos
            </h2>

            <p>
              Ao acessar a plataforma, criar
              uma conta ou utilizar qualquer
              funcionalidade, o usuário declara
              que leu e concorda com estes
              Termos e com a Política de
              Privacidade do FriBolos.
            </p>

            <p>
              Caso não concorde com alguma
              condição, o usuário deverá deixar
              de utilizar as funcionalidades
              que dependam dessa aceitação.
            </p>
          </section>

          <section id="cadastro">
            <span className="legal-number">
              02
            </span>

            <h2>
              Cadastro e acesso
            </h2>

            <p>
              Para utilizar determinadas
              funcionalidades, será necessário
              criar uma conta e fornecer
              informações verdadeiras,
              completas e atualizadas.
            </p>

            <ul>
              <li>
                O usuário é responsável pela
                veracidade dos dados
                cadastrados;
              </li>

              <li>
                A senha é pessoal e não deve
                ser compartilhada;
              </li>

              <li>
                O usuário deverá comunicar
                qualquer suspeita de acesso
                indevido;
              </li>

              <li>
                Dados desatualizados poderão
                prejudicar entregas,
                comunicações e pagamentos;
              </li>

              <li>
                Contas utilizadas para fraude,
                abuso ou atividades ilícitas
                poderão ser suspensas.
              </li>
            </ul>
          </section>

          <section id="produtos">
            <span className="legal-number">
              03
            </span>

            <h2>
              Produtos e catálogo
            </h2>

            <p>
              As imagens apresentadas no
              catálogo possuem finalidade
              ilustrativa. Por se tratarem de
              produtos artesanais, podem
              ocorrer pequenas variações de
              cores, acabamentos, decoração,
              tamanho e apresentação.
            </p>

            <p>
              Preços, descrições,
              disponibilidade, estoque,
              quantidades mínimas e prazos de
              preparo poderão ser atualizados
              sem aviso prévio.
            </p>

            <p>
              A inclusão de um produto no
              carrinho não representa reserva
              de estoque nem confirmação da
              encomenda.
            </p>
          </section>

          <section id="pedidos">
            <span className="legal-number">
              04
            </span>

            <h2>
              Pedidos e encomendas
            </h2>

            <p>
              Antes da confirmação, o cliente
              deverá revisar os produtos,
              quantidades, personalizações,
              valores, endereço, data e forma
              de recebimento.
            </p>

            <p>
              Um pedido estará sujeito à
              disponibilidade de produtos,
              capacidade de produção,
              confirmação do pagamento e
              aceitação pelo FriBolos.
            </p>

            <p>
              Caso não seja possível atender
              uma solicitação, o cliente será
              informado pelos canais
              cadastrados e, quando aplicável,
              receberá a devolução dos valores
              pagos.
            </p>

            <p>
              Informações adicionais ou
              solicitações de personalização
              somente integrarão o pedido
              quando forem aceitas e
              registradas na plataforma ou
              confirmadas pelo atendimento.
            </p>
          </section>

          <section id="orcamentos">
            <span className="legal-number">
              05
            </span>

            <h2>
              Solicitações de orçamento
            </h2>

            <p>
              Produtos personalizados poderão
              depender de análise e orçamento
              específico. A solicitação de um
              orçamento não obriga o cliente a
              contratar nem o FriBolos a
              aceitar a encomenda.
            </p>

            <p>
              O orçamento poderá considerar
              tamanho, quantidade, ingredientes,
              decoração, complexidade, data,
              prazo de produção e forma de
              recebimento.
            </p>

            <p>
              A encomenda será confirmada
              somente depois da aceitação da
              proposta pelo cliente e do
              cumprimento das condições de
              pagamento apresentadas.
            </p>
          </section>

          <section id="pagamentos">
            <span className="legal-number">
              06
            </span>

            <h2>Pagamentos</h2>

            <p>
              Os meios de pagamento disponíveis
              serão apresentados durante a
              finalização do pedido. O
              processamento poderá ser
              realizado por prestadores
              externos especializados.
            </p>

            <p>
              A aprovação depende das
              verificações efetuadas pelo
              provedor de pagamento e pela
              instituição financeira do
              cliente.
            </p>

            <p>
              O FriBolos não se responsabiliza
              por recusas decorrentes de limite,
              bloqueio, dados incorretos ou
              indisponibilidade da instituição
              financeira.
            </p>

            <p>
              Em caso de cobrança aparentemente
              incorreta, o cliente deverá
              entrar em contato pelos canais
              oficiais de atendimento.
            </p>
          </section>

          <section id="entrega">
            <span className="legal-number">
              07
            </span>

            <h2>
              Entrega e retirada
            </h2>

            <p>
              O cliente deverá fornecer um
              endereço completo, correto e
              acessível, além de garantir que
              haverá alguém disponível para
              receber o pedido no período
              combinado.
            </p>

            <p>
              A entrega poderá estar limitada
              às regiões atendidas e sujeita à
              cobrança de taxa, apresentada
              antes da conclusão do pedido.
            </p>

            <p>
              Atrasos excepcionais poderão
              ocorrer em razão de trânsito,
              clima, acidentes, indisponibilidade
              de serviços ou outros eventos
              fora do controle razoável do
              FriBolos.
            </p>

            <p>
              Na retirada, o cliente deverá
              comparecer ao local e horário
              informados. Produtos perecíveis
              deverão ser retirados e
              armazenados adequadamente.
            </p>
          </section>

          <section id="cancelamentos">
            <span className="legal-number">
              08
            </span>

            <h2>
              Cancelamentos, alterações e
              reembolsos
            </h2>

            <p>
              Solicitações de cancelamento,
              reagendamento ou alteração
              deverão ser realizadas pelos
              recursos disponibilizados na
              plataforma ou pelos canais
              oficiais de atendimento.
            </p>

            <p>
              A possibilidade de cancelamento
              ou alteração dependerá do estágio
              de produção, da compra de
              ingredientes, da personalização
              solicitada e da proximidade da
              data de entrega ou retirada,
              sempre respeitando a legislação
              aplicável.
            </p>

            <p>
              Produtos personalizados ou já em
              produção poderão possuir
              restrições de cancelamento quando
              não puderem ser reaproveitados ou
              revendidos.
            </p>

            <p>
              Quando devido, o reembolso será
              solicitado pelo mesmo meio de
              pagamento utilizado. O prazo para
              sua visualização poderá depender
              do provedor de pagamento e da
              instituição financeira.
            </p>

            <p>
              Problemas com o produto deverão
              ser comunicados assim que
              identificados, preferencialmente
              acompanhados de imagens e das
              informações do pedido.
            </p>
          </section>

          <section id="avaliacoes">
            <span className="legal-number">
              09
            </span>

            <h2>
              Avaliações e comentários
            </h2>

            <p>
              Clientes poderão avaliar pedidos
              concluídos. Ao enviar uma
              avaliação, o usuário declara que
              o conteúdo representa sua
              experiência verdadeira.
            </p>

            <p>
              Não serão permitidos conteúdos
              ofensivos, discriminatórios,
              fraudulentos, ilícitos, que
              exponham dados pessoais ou violem
              direitos de terceiros.
            </p>

            <p>
              As avaliações poderão ser
              exibidas nas páginas do FriBolos
              sem a divulgação do nome completo
              ou de outras informações pessoais
              do cliente.
            </p>
          </section>

          <section id="responsabilidades">
            <span className="legal-number">
              10
            </span>

            <h2>
              Responsabilidades do usuário
            </h2>

            <p>
              Ao utilizar a plataforma, o
              usuário compromete-se a:
            </p>

            <ul>
              <li>
                Fornecer informações corretas e
                atualizadas;
              </li>

              <li>
                Não utilizar dados ou meios de
                pagamento de terceiros sem
                autorização;
              </li>

              <li>
                Não tentar acessar contas,
                áreas ou informações sem
                permissão;
              </li>

              <li>
                Não interferir na segurança ou
                no funcionamento da plataforma;
              </li>

              <li>
                Informar previamente alergias,
                intolerâncias ou restrições
                alimentares relevantes;
              </li>

              <li>
                Conservar e consumir os
                produtos conforme as
                orientações recebidas.
              </li>
            </ul>

            <p>
              O FriBolos não poderá garantir
              ausência absoluta de traços de
              ingredientes quando a produção
              ocorrer em ambiente que também
              manipule outros alimentos. Casos
              de alergias graves deverão ser
              informados antes da confirmação
              da encomenda.
            </p>
          </section>

          <section id="privacidade">
            <span className="legal-number">
              11
            </span>

            <h2>
              Privacidade e proteção de dados
            </h2>

            <p>
              O tratamento de dados pessoais
              relacionado ao uso da plataforma
              é explicado na Política de
              Privacidade do FriBolos.
            </p>

            <div className="legal-contact-card">
              <div>
                <strong>
                  Política de Privacidade
                </strong>

                <span>
                  Consulte como seus dados são
                  utilizados e protegidos.
                </span>
              </div>

              <Link href="/politica-de-privacidade">
                Consultar
                <span>→</span>
              </Link>
            </div>
          </section>

          <section id="alteracoes">
            <span className="legal-number">
              12
            </span>

            <h2>
              Disponibilidade e alterações
            </h2>

            <p>
              A plataforma poderá passar por
              atualizações, manutenções ou
              indisponibilidades temporárias.
              Sempre que possível, serão
              adotadas medidas para restabelecer
              seu funcionamento.
            </p>

            <p>
              Estes Termos poderão ser
              atualizados para refletir
              mudanças legais, comerciais ou
              operacionais. A versão mais
              recente permanecerá disponível
              nesta página com sua data de
              atualização.
            </p>

            <p>
              As relações de consumo e
              eventuais controvérsias serão
              tratadas conforme a legislação
              brasileira aplicável, preservados
              os direitos legalmente garantidos
              ao consumidor.
            </p>
          </section>

          <section id="contato">
            <span className="legal-number">
              13
            </span>

            <h2>Contato</h2>

            <p>
              Em caso de dúvidas sobre estes
              Termos, pedidos, pagamentos,
              cancelamentos ou utilização da
              plataforma, entre em contato
              pelos canais oficiais informados
              no site.
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

        <Link href="/politica-de-privacidade">
          Política de Privacidade
        </Link>
      </footer>
    </main>
  );
}