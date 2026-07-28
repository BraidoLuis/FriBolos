"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  Quote,
} from "../../types";

import {
  Status,
} from "../ui";

type QuoteFilter =
  | "all"
  | "awaiting"
  | "analysis"
  | "approved";

type ClientQuotesProps = {
  quotes: Quote[];

  onAnswer: (
    id: string,
    decision:
      | "approved"
      | "rejected"
  ) => Promise<boolean>;

  onNewQuote: () => void;
};

export function ClientQuotes({
  quotes,
  onAnswer,
  onNewQuote,
}: ClientQuotesProps) {
  const [
    respondingQuoteId,
    setRespondingQuoteId,
  ] = useState<string | null>(
    null
  );

  const [
    responseError,
    setResponseError,
  ] = useState("");

  const [filter, setFilter] =
    useState<QuoteFilter>("all");

  const awaitingQuotesCount =
    quotes.filter(
      quote =>
        quote.statusCode ===
        "awaiting_customer"
    ).length;

  const analysisQuotesCount =
    quotes.filter(quote =>
      [
        "pending",
        "in_review",
      ].includes(quote.statusCode)
    ).length;

  const approvedQuotesCount =
    quotes.filter(
      quote =>
        quote.statusCode ===
        "approved"
    ).length;

  const visibleQuotes =
    useMemo(() => {
      if (filter === "awaiting") {
        return quotes.filter(
          quote =>
            quote.statusCode ===
            "awaiting_customer"
        );
      }

      if (filter === "analysis") {
        return quotes.filter(
          quote =>
            [
              "pending",
              "in_review",
            ].includes(
              quote.statusCode
            )
        );
      }

      if (filter === "approved") {
        return quotes.filter(
          quote =>
            quote.statusCode ===
            "approved"
        );
      }

      return quotes;
    }, [quotes, filter]);

  async function answerQuote(
    quote: Quote,
    decision:
      | "approved"
      | "rejected"
  ) {
    const action =
      decision === "approved"
        ? "aceitar"
        : "recusar";

    const confirmed =
      window.confirm(
        `Deseja ${action} o orçamento ${quote.id}?`
      );

    if (!confirmed) {
      return;
    }

    setResponseError("");

    setRespondingQuoteId(
      quote.databaseId
    );

    const success =
      await onAnswer(
        quote.databaseId,
        decision
      );

    setRespondingQuoteId(null);

    if (!success) {
      setResponseError(
        "Não foi possível responder ao orçamento."
      );
    }
  }

  return (
    <div className="client-quotes-page">
      <header className="client-quotes-hero">
        <div>
          <p className="eyebrow">
            PROPOSTAS PERSONALIZADAS
          </p>

          <h1>
            Meus orçamentos
          </h1>

          <p>
            Acompanhe suas solicitações,
            consulte as propostas enviadas
            pela confeitaria e responda quando
            tudo estiver do jeitinho que você
            imaginou.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewQuote}
        >
          ＋ Solicitar orçamento
        </button>
      </header>

      <section className="client-quote-summary">
        <article>
          <span>◇</span>

          <div>
            <small>
              Todas as solicitações
            </small>

            <b>{quotes.length}</b>
          </div>
        </article>

        <article
          className={
            awaitingQuotesCount > 0
              ? "attention"
              : ""
          }
        >
          <span>!</span>

          <div>
            <small>
              Aguardando sua resposta
            </small>

            <b>
              {awaitingQuotesCount}
            </b>
          </div>
        </article>

        <article>
          <span>◷</span>

          <div>
            <small>
              Em análise
            </small>

            <b>
              {analysisQuotesCount}
            </b>
          </div>
        </article>

        <article>
          <span>✓</span>

          <div>
            <small>
              Propostas aprovadas
            </small>

            <b>
              {approvedQuotesCount}
            </b>
          </div>
        </article>
      </section>

      {responseError && (
        <div
          className="client-quote-error"
          role="alert"
        >
          <span>!</span>

          <p>{responseError}</p>

          <button
            type="button"
            onClick={() =>
              setResponseError("")
            }
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      )}

      {quotes.length > 0 && (
        <section className="client-quote-toolbar">
          <div>
            <button
              type="button"
              className={
                filter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("all")
              }
            >
              Todas
              <b>{quotes.length}</b>
            </button>

            <button
              type="button"
              className={
                filter === "awaiting"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("awaiting")
              }
            >
              Aguardando resposta
              <b>
                {awaitingQuotesCount}
              </b>
            </button>

            <button
              type="button"
              className={
                filter === "analysis"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("analysis")
              }
            >
              Em análise
              <b>
                {analysisQuotesCount}
              </b>
            </button>

            <button
              type="button"
              className={
                filter === "approved"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setFilter("approved")
              }
            >
              Aprovadas
              <b>
                {approvedQuotesCount}
              </b>
            </button>
          </div>

          <span>
            {visibleQuotes.length === 1
              ? "1 orçamento"
              : `${visibleQuotes.length} orçamentos`}
          </span>
        </section>
      )}

      {quotes.length === 0 ? (
        <section className="client-quotes-empty">
          <span>◇</span>

          <p className="eyebrow">
            SUA IDEIA, NOSSO CARINHO
          </p>

          <h2>
            Nenhum orçamento solicitado
          </h2>

          <p>
            Conte como você imagina sua
            encomenda e envie uma referência.
            A FriBolos preparará uma proposta
            personalizada para você.
          </p>

          <button
            type="button"
            onClick={onNewQuote}
          >
            Solicitar meu primeiro orçamento
          </button>
        </section>
      ) : visibleQuotes.length === 0 ? (
        <section className="client-quotes-empty small">
          <span>⌕</span>

          <h2>
            Nenhum orçamento nessa categoria
          </h2>

          <p>
            Escolha outro filtro para visualizar
            suas solicitações.
          </p>

          <button
            type="button"
            onClick={() =>
              setFilter("all")
            }
          >
            Ver todos
          </button>
        </section>
      ) : (
        <section className="client-quotes-list">
          {visibleQuotes.map(
            quote => {
              const awaitingAnswer =
                quote.statusCode ===
                "awaiting_customer";

              const isResponding =
                respondingQuoteId ===
                quote.databaseId;

              const hasDefinedValue =
                quote.value &&
                quote.value !==
                  "A definir";

              return (
                <article
                  className={[
                    "client-quote-card",
                    awaitingAnswer
                      ? "awaiting-answer"
                      : "",
                    `quote-${quote.statusCode}`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={quote.databaseId}
                >
                  <header className="client-quote-card-header">
                    <div>
                      <span className="client-quote-number">
                        {quote.id}
                      </span>

                      <small>
                        Solicitação de orçamento
                      </small>
                    </div>

                    <Status>
                      {quote.status}
                    </Status>
                  </header>

                  {awaitingAnswer && (
                    <div className="client-quote-attention">
                      <span>!</span>

                      <div>
                        <b>
                          Sua proposta está pronta
                        </b>

                        <p>
                          Confira os detalhes e
                          escolha se deseja aceitar
                          ou recusar este orçamento.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="client-quote-card-body">
                    <div className="client-quote-main">
                      <p className="eyebrow">
                        ENCOMENDA SOLICITADA
                      </p>

                      <h2>
                        {quote.item}
                      </h2>

                      <p
                        className="client-quote-details"
                        style={{
                          whiteSpace:
                            "pre-line",
                        }}
                      >
                        {quote.details}
                      </p>

                      <div className="client-quote-date">
                        <span>◷</span>

                        <div>
                          <small>
                            Data desejada
                          </small>

                          <b>
                            {quote.date}

                            {quote.time !==
                            "A combinar"
                              ? ` às ${quote.time}`
                              : " — horário a combinar"}
                          </b>
                        </div>
                      </div>
                    </div>

                    <aside className="client-quote-side">
                      <div className="client-quote-value">
                        <small>
                          Valor da proposta
                        </small>

                        <strong
                          className={
                            hasDefinedValue
                              ? ""
                              : "undefined"
                          }
                        >
                          {quote.value ||
                            "A definir"}
                        </strong>

                        {!hasDefinedValue && (
                          <p>
                            A confeitaria ainda está
                            preparando o valor.
                          </p>
                        )}
                      </div>

                      {quote.image && (
                        <a
                          className="client-quote-reference"
                          href={quote.image}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={quote.image}
                            alt={`Imagem de referência do orçamento ${quote.id}`}
                          />

                          <div>
                            <strong>
                              Imagem de referência
                            </strong>

                            <span>
                              Clique para ampliar
                            </span>
                          </div>

                          <i>↗</i>
                        </a>
                      )}
                    </aside>
                  </div>

                  {quote.adminMessage && (
                    <section className="client-quote-admin-message">
                      <span>♡</span>

                      <div>
                        <small>
                          MENSAGEM DA FRIBOLOS
                        </small>

                        <p>
                          {
                            quote.adminMessage
                          }
                        </p>
                      </div>
                    </section>
                  )}

                  <footer className="client-quote-card-footer">
                    <div>
                      <small>
                        Situação atual
                      </small>

                      <strong>
                        {awaitingAnswer
                          ? "Aguardando sua decisão"
                          : quote.status}
                      </strong>
                    </div>

                    {awaitingAnswer ? (
                      <div className="client-quote-actions">
                        <button
                          type="button"
                          className="reject-quote"
                          disabled={
                            isResponding
                          }
                          onClick={() =>
                            answerQuote(
                              quote,
                              "rejected"
                            )
                          }
                        >
                          {isResponding
                            ? "Processando..."
                            : "Recusar"}
                        </button>

                        <button
                          type="button"
                          className="approve-quote"
                          disabled={
                            isResponding
                          }
                          onClick={() =>
                            answerQuote(
                              quote,
                              "approved"
                            )
                          }
                        >
                          {isResponding
                            ? "Processando..."
                            : "✓ Aceitar proposta"}
                        </button>
                      </div>
                    ) : (
                      <Status>
                        {quote.status}
                      </Status>
                    )}
                  </footer>
                </article>
              );
            }
          )}
        </section>
      )}
    </div>
  );
}