import Link from "next/link";

import {
  ThemeToggle,
} from "./components/theme-toggle";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <header className="not-found-header">
        <Link
          href="/"
          className="not-found-brand"
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

        <ThemeToggle />
      </header>

      <section className="not-found-content">
        <div className="not-found-decoration">
          <span>4</span>

          <img
            src="/FaviconFribolos.png"
            alt=""
          />

          <span>4</span>
        </div>

        <p className="eyebrow">
          PÁGINA NÃO ENCONTRADA
        </p>

        <h1>
          Parece que esse doce
          <br />
          saiu do cardápio.
        </h1>

        <p className="not-found-description">
          O endereço informado não existe,
          foi alterado ou não está mais
          disponível.
        </p>

        <div className="not-found-actions">
          <Link
            href="/"
            className="not-found-primary"
          >
            Voltar ao início
            <span>→</span>
          </Link>

          <Link
            href="/catalogo"
            className="not-found-secondary"
          >
            Ver catálogo
          </Link>
        </div>

        <small className="not-found-help">
          Se você chegou aqui por um link do
          FriBolos, tente voltar à página
          anterior.
        </small>
      </section>
    </main>
  );
}