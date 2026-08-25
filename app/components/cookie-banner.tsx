"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

const STORAGE_KEY =
  "fribolos-storage-notice-v1";

export function CookieBanner() {
  const [visible, setVisible] =
    useState(false);

  useEffect(() => {
    /*
     * O atraso evita alterar o estado
     * sincronamente durante o efeito e
     * mantém a renderização inicial igual
     * no servidor e no navegador.
     */
    const timer = window.setTimeout(() => {
      try {
        const acknowledged =
          window.localStorage.getItem(
            STORAGE_KEY
          );

        setVisible(
          acknowledged !== "acknowledged"
        );
      } catch {
        /*
         * Caso o armazenamento esteja
         * indisponível, o aviso continua
         * visível nesta visita.
         */
        setVisible(true);
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function acknowledgeNotice() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        "acknowledged"
      );
    } catch {
      /*
       * Mesmo sem acesso ao localStorage,
       * permite fechar o aviso durante a
       * sessão atual.
       */
    }

    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <aside
      className="cookie-banner"
      aria-label="Aviso de privacidade"
      aria-live="polite"
    >
      <div className="cookie-banner-icon">
        ♡
      </div>

      <div className="cookie-banner-content">
        <strong>
          Sua privacidade importa
        </strong>

        <p>
          Utilizamos armazenamento local e de
          sessão para manter seu acesso,
          preservar preferências e garantir o
          funcionamento do site.
        </p>

        <Link href="/politica-de-privacidade">
          Saiba mais na Política de
          Privacidade
        </Link>
      </div>

      <button
        type="button"
        onClick={acknowledgeNotice}
      >
        Entendi
      </button>
    </aside>
  );
}