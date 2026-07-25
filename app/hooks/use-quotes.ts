"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { supabase } from "../lib/supabase";

import {
  databasePrice,
  money,
} from "../lib/formatters";

import { mapQuote } from "../lib/mappers";

import type {
  Quote,
  QuoteRow,
  Role,
} from "../types";

type UseQuotesOptions = {
  authLoading: boolean;
  role: Role | null;

  setToast: Dispatch<
    SetStateAction<string>
  >;
};

export function useQuotes({
  authLoading,
  role,
  setToast,
}: UseQuotesOptions) {
  const [
    quotes,
    setQuotes,
  ] = useState<Quote[]>([]);

  const [
    updatingQuoteId,
    setUpdatingQuoteId,
  ] = useState<string | null>(null);

  const showToast = useCallback(
    (
      message: string,
      duration: number
    ) => {
      setToast(message);

      setTimeout(() => {
        setToast("");
      }, duration);
    },
    [setToast]
  );

  useEffect(() => {
    if (authLoading || !role) {
      return;
    }

    let componentActive = true;

    async function loadQuotes() {
      const {
        data,
        error: quotesError,
      } = await supabase
        .from("quotes")
        .select(`
          id,
          quote_number,
          order_id,
          customer_name,
          title,
          details,
          desired_date,
          desired_time,
          quoted_amount,
          admin_message,
          reference_image_url,
          status,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!componentActive) {
        return;
      }

      if (quotesError) {
        console.error(
          "Erro ao carregar orçamentos:",
          quotesError
        );

        showToast(
          "Não foi possível carregar os orçamentos.",
          2800
        );

        return;
      }

      const quoteRows =
        (data || []) as QuoteRow[];

      const mappedQuotes =
        await Promise.all(
          quoteRows.map(async row => {
            const quote = mapQuote(row);

            if (!quote.imagePath) {
              return quote;
            }

            const {
              data: signedUrlData,
              error: signedUrlError,
            } = await supabase.storage
              .from("quote-images")
              .createSignedUrl(
                quote.imagePath,
                60 * 60
              );

            if (signedUrlError) {
              console.error(
                `Erro ao carregar a imagem do orçamento ${quote.id}:`,
                signedUrlError
              );

              return quote;
            }

            return {
              ...quote,
              image:
                signedUrlData.signedUrl,
            };
          })
        );

      if (!componentActive) {
        return;
      }

      setQuotes(mappedQuotes);
    }

    loadQuotes();

    return () => {
      componentActive = false;
    };
  }, [
    authLoading,
    role,
    showToast,
  ]);

  async function handleAdminQuoteResponse(
    quote: Quote,
    value: string,
    message: string
  ) {
    const amount = databasePrice(value);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      showToast(
        "Informe um valor válido para o orçamento.",
        2800
      );

      return false;
    }

    setUpdatingQuoteId(
      quote.databaseId
    );

    try {
      const {
        error: responseError,
      } = await supabase.rpc(
        "admin_respond_quote",
        {
          p_quote_id:
            quote.databaseId,

          p_amount: amount,

          p_message:
            message || null,
        }
      );

      if (responseError) {
        console.error(
          "Erro ao responder orçamento:",
          responseError
        );

        showToast(
          "Não foi possível enviar o orçamento.",
          2800
        );

        return false;
      }

      setQuotes(currentQuotes =>
        currentQuotes.map(currentQuote =>
          currentQuote.databaseId ===
          quote.databaseId
            ? {
                ...currentQuote,
                value: money(amount),

                status:
                  "Aguardando cliente",

                statusCode:
                  "awaiting_customer",

                adminMessage: message,
              }
            : currentQuote
        )
      );

      showToast(
        "Orçamento enviado ao cliente!",
        2200
      );

      return true;
    } catch (error) {
      console.error(
        "Erro inesperado ao responder orçamento:",
        error
      );

      showToast(
        "Ocorreu um erro ao enviar o orçamento.",
        2800
      );

      return false;
    } finally {
      setUpdatingQuoteId(null);
    }
  }

  async function handleClientQuoteResponse(
    quoteId: string,
    decision:
      | "approved"
      | "rejected"
  ) {
    try {
      const {
        error: responseError,
      } = await supabase.rpc(
        "respond_to_quote",
        {
          p_quote_id: quoteId,
          p_decision: decision,
        }
      );

      if (responseError) {
        console.error(
          "Erro ao responder orçamento:",
          responseError
        );

        return false;
      }

      setQuotes(currentQuotes =>
        currentQuotes.map(quote =>
          quote.databaseId === quoteId
            ? {
                ...quote,

                status:
                  decision ===
                  "approved"
                    ? "Aprovado"
                    : "Recusado",

                statusCode: decision,
              }
            : quote
        )
      );

      return true;
    } catch (error) {
      console.error(
        "Erro inesperado ao responder orçamento:",
        error
      );

      return false;
    }
  }

  return {
    quotes,
    updatingQuoteId,
    handleAdminQuoteResponse,
    handleClientQuoteResponse,
  };
}