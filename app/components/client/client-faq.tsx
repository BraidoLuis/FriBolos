"use client";

import {
  useState,
} from "react";

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question:
      "Como faço uma nova encomenda?",
    answer:
      "Acesse o catálogo, escolha os produtos desejados e adicione-os ao carrinho. Produtos personalizáveis também permitem selecionar opções antes de serem adicionados. Depois, confira o carrinho, escolha a forma de recebimento e prossiga para o pagamento.",
  },
  {
    question:
      "Posso personalizar meu pedido?",
    answer:
      "Sim. Os produtos que aceitam personalização possuem o botão “Personalizar”. Nele, você poderá escolher as opções disponíveis e incluir as informações necessárias antes de adicionar o produto ao carrinho.",
  },
  {
    question:
      "Qual é o prazo de preparação?",
    answer:
      "O prazo de preparação é informado individualmente em cada produto do catálogo. A data escolhida também precisa respeitar os dias e horários de funcionamento da confeitaria e a disponibilidade para novas encomendas.",
  },
  {
    question:
      "Posso escolher entre entrega e retirada?",
    answer:
      "Sim, quando as duas modalidades estiverem disponíveis. Durante a finalização do pedido, você poderá escolher entrega no endereço cadastrado ou retirada no local. Para entregas, poderá ser acrescentada a taxa configurada pela confeitaria.",
  },
  {
    question:
      "Como acompanho o andamento do pedido?",
    answer:
      "Depois que o pedido for criado, acesse “Meus pedidos”. Nessa área você poderá consultar o status, a forma de recebimento, a data combinada, o pagamento e as atualizações da produção.",
  },
  {
    question:
      "É possível reagendar ou cancelar uma encomenda?",
    answer:
      "Você pode enviar uma solicitação pela área “Meus pedidos”, desde que o pedido ainda permita alterações. A confeitaria analisará a solicitação e você poderá acompanhar a resposta pelo próprio sistema e pelas notificações.",
  },
  {
    question:
      "Como funcionam os orçamentos personalizados?",
    answer:
      "Na área “Orçamentos”, descreva o que deseja, informe uma data aproximada e envie uma imagem de referência, caso tenha. A confeitaria analisará a solicitação e enviará o valor e as orientações para sua aprovação.",
  },
  {
    question:
      "Como posso falar diretamente com a FriBolos?",
    answer:
      "Na página inicial da sua conta existe a seção “Precisa de ajuda?”. Utilize o botão do WhatsApp para conversar diretamente com a confeitaria dentro do horário de atendimento informado.",
  },
];

export function ClientFaq() {
  const [openItem, setOpenItem] =
    useState<number | null>(0);

  function toggleItem(index: number) {
    setOpenItem(current =>
      current === index
        ? null
        : index
    );
  }

  return (
    <section className="client-faq-section">
      <div className="client-faq-heading">
        <div>
          <p className="eyebrow">
            TIRE SUAS DÚVIDAS
          </p>

          <h2>
            Perguntas frequentes
          </h2>

          <p>
            Reunimos as principais informações
            para deixar sua experiência com a
            FriBolos mais simples e tranquila.
          </p>
        </div>

        <span aria-hidden="true">
          ?
        </span>
      </div>

      <div className="client-faq-list">
        {faqItems.map(
          (item, index) => {
            const isOpen =
              openItem === index;

            const answerId =
              `client-faq-answer-${index}`;

            return (
              <article
                key={item.question}
                className={
                  isOpen
                    ? "open"
                    : ""
                }
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() =>
                    toggleItem(index)
                  }
                >
                  <span className="client-faq-number">
                    {String(
                      index + 1
                    ).padStart(2, "0")}
                  </span>

                  <strong>
                    {item.question}
                  </strong>

                  <i aria-hidden="true">
                    +
                  </i>
                </button>

                <div
                  id={answerId}
                  className="client-faq-answer"
                  aria-hidden={!isOpen}
                >
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          }
        )}
      </div>
    </section>
  );
}