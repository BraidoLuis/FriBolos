"use client";

import {
  useState,
  type FormEvent,
} from "react";

import type { Quote } from "../../types";

import { Status } from "../ui";

export function AdminQuotes({
  quotes,
  onUpdate,
  updatingQuoteId,
}: {
  quotes: Quote[];
  onUpdate: (
    quote: Quote,
    value: string,
    message: string
  ) => Promise<boolean>;
  updatingQuoteId: string | null;
}) {
  const [editing, setEditing] =
    useState<Quote | null>(null);

  async function submitProposal(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!editing) {
      return;
    }

    const data = new FormData(
      e.currentTarget
    );

    const success = await onUpdate(
      editing,
      String(data.get("value") || ""),
      String(data.get("message") || "")
    );

    if (success) {
      setEditing(null);
    }
  }

  return (
    <div className="content">
      <div className="page-actions">
        <div>
          <h2 className="section-title">
            Solicitações de orçamento
          </h2>

          <p className="section-subtitle">
            Analise, defina o valor e envie a
            proposta ao cliente.
          </p>
        </div>
      </div>

      {quotes.length === 0 ? (
        <div className="empty-cart">
          <span>◇</span>
          <h3>Nenhum orçamento recebido</h3>
        </div>
      ) : (
        <div className="quote-grid">
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
                {quote.client} • Entrega{" "}
                {quote.date} às {quote.time}
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
                  <strong>Mensagem:</strong>{" "}
                  {quote.adminMessage}
                </p>
              )}

              <footer>
                <strong>{quote.value}</strong>

                {![
                  "approved",
                  "rejected",
                  "cancelled",
                ].includes(
                  quote.statusCode
                ) && (
                  <button
                    disabled={
                      updatingQuoteId ===
                      quote.databaseId
                    }
                    onClick={() =>
                      setEditing(quote)
                    }
                  >
                    {quote.statusCode ===
                    "awaiting_customer"
                      ? "Editar proposta"
                      : "Montar proposta"}
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (
              e.currentTarget === e.target
            ) {
              setEditing(null);
            }
          }}
        >
          <form
            className="modal"
            onSubmit={submitProposal}
          >
            <div className="modal-title">
              <div>
                <p>{editing.id}</p>
                <h2>Enviar proposta</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing(null)
                }
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                Valor proposto

                <input
                  required
                  name="value"
                  defaultValue={
                    editing.value === "A definir"
                      ? ""
                      : editing.value.replace(
                          "R$ ",
                          ""
                        )
                  }
                  placeholder="Ex.: 350,00"
                />
              </label>

              <label className="wide">
                Mensagem ao cliente

                <textarea
                  name="message"
                  defaultValue={
                    editing.adminMessage ||
                    "Informe os detalhes incluídos nesta proposta."
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                disabled={
                  updatingQuoteId ===
                  editing.databaseId
                }
                onClick={() =>
                  setEditing(null)
                }
              >
                Cancelar
              </button>

              <button
                className="primary"
                disabled={
                  updatingQuoteId ===
                  editing.databaseId
                }
              >
                {updatingQuoteId ===
                editing.databaseId
                  ? "Enviando proposta..."
                  : "Enviar orçamento"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}