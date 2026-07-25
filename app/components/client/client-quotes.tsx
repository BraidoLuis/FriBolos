"use client";

import { useState } from "react";

import type { Quote } from "../../types";

import { Status } from "../ui";
  
export function ClientQuotes({
  quotes,
  onAnswer,
}: {
  quotes: Quote[];
  onAnswer: (
    id: string,
    decision: "approved" | "rejected"
  ) => Promise<boolean>;
}) {
  const [
    respondingQuoteId,
    setRespondingQuoteId,
  ] = useState<string | null>(null);

  const [responseError, setResponseError] =
    useState("");

  async function answerQuote(
    quote: Quote,
    decision: "approved" | "rejected"
  ) {
    const action =
      decision === "approved"
        ? "aceitar"
        : "recusar";

    const confirmed = window.confirm(
      `Deseja ${action} o orçamento ${quote.id}?`
    );

    if (!confirmed) {
      return;
    }

    setResponseError("");
    setRespondingQuoteId(
      quote.databaseId
    );

    const success = await onAnswer(
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
    <>
      <div className="client-page-title">
        <p className="eyebrow">PROPOSTAS</p>
        <h1>Meus orçamentos</h1>

        <span>
          Aceite ou recuse as propostas enviadas
          pela confeitaria.
        </span>
      </div>

      {responseError && (
        <p className="form-error">
          {responseError}
        </p>
      )}

      {quotes.length === 0 ? (
        <div className="empty-cart">
          <span>◇</span>
          <h3>Nenhum orçamento solicitado</h3>
        </div>
      ) : (
        <div className="quote-grid client-quotes">
          {quotes.map(quote => (
            <article
              className="panel quote-card"
              key={quote.databaseId}
            >
              <div>
                <span>{quote.id}</span>

                <Status>
                  {quote.status}
                </Status>
              </div>

              <small>
                Entrega prevista: {quote.date}
                {quote.time !== "A combinar"
                  ? ` às ${quote.time}`
                  : ""}
              </small>

              <h3>{quote.item}</h3>

              <p
                style={{
                  whiteSpace: "pre-line",
                }}
              >
                {quote.details}
              </p>

              {quote.image && (
                <a
                  className="quote-reference"
                  href={quote.image}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={quote.image}
                    alt={`Imagem de referência do orçamento ${quote.id}`}
                  />

                  <div>
                    <strong>Imagem de referência</strong>
                    <span>Clique para visualizar</span>
                  </div>
                </a>
              )}

              {quote.adminMessage && (
                <p>
                  <strong>
                    Mensagem da confeitaria:
                  </strong>{" "}
                  {quote.adminMessage}
                </p>
              )}

              <footer>
                <strong>{quote.value}</strong>

                {quote.statusCode ===
                "awaiting_customer" ? (
                  <div>
                    <button
                      className="secondary"
                      disabled={
                        respondingQuoteId ===
                        quote.databaseId
                      }
                      onClick={() =>
                        answerQuote(
                          quote,
                          "rejected"
                        )
                      }
                    >
                      {respondingQuoteId ===
                      quote.databaseId
                        ? "Processando..."
                        : "Recusar"}
                    </button>

                    <button
                      disabled={
                        respondingQuoteId ===
                        quote.databaseId
                      }
                      onClick={() =>
                        answerQuote(
                          quote,
                          "approved"
                        )
                      }
                    >
                      {respondingQuoteId ===
                      quote.databaseId
                        ? "Processando..."
                        : "Aceitar proposta"}
                    </button>
                  </div>
                ) : (
                  <Status>
                    {quote.status}
                  </Status>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  );
}