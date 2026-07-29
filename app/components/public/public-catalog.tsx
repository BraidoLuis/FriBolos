"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import Link from "next/link";

import {
  mapProduct,
} from "../../lib/mappers";

import {
  normalizeSearch,
} from "../../lib/formatters";

import type {
  Product,
  ProductRow,
} from "../../types";

import {
  ProductVisual,
} from "../ui";

import {
  ThemeToggle,
} from "../theme-toggle";

export function PublicCatalog() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [category, setCategory] =
    useState("Todos");

  const [query, setQuery] =
    useState("");

  useEffect(() => {
    let componentActive = true;

    async function loadPublicProducts() {
      setLoading(true);
      setError("");

      try {
        const {
          data,
          error: productsError,
        } = await supabase
          .from("products")
          .select(`
            id,
            name,
            category,
            price,
            description,
            image_url,
            preparation_time,
            minimum_order,
            stock_quantity,
            low_stock_limit,
            is_active,
            is_archived,
            is_featured,
            featured_order,
            is_customizable,
            product_options (
              option_name
            )
          `)
          .eq("is_active", true)
          .eq("is_archived", false)
          .order("is_featured", {
            ascending: false,
          })
          .order("featured_order", {
            ascending: true,
          })
          .order("created_at", {
            ascending: false,
          });

        if (!componentActive) {
          return;
        }

        if (productsError) {
          console.error(
            "Erro ao carregar catálogo público:",
            productsError
          );

          setError(
            "Não foi possível carregar o catálogo."
          );

          return;
        }

        const rows =
          (data || []) as ProductRow[];

        setProducts(
          rows.map(mapProduct)
        );
      } catch (unexpectedError) {
        console.error(
          "Erro inesperado no catálogo público:",
          unexpectedError
        );

        if (componentActive) {
          setError(
            "Ocorreu um erro ao carregar os produtos."
          );
        }
      } finally {
        if (componentActive) {
          setLoading(false);
        }
      }
    }

    void loadPublicProducts();

    return () => {
      componentActive = false;
    };
  }, []);

  const categories = useMemo(
    () => [
      "Todos",

      ...Array.from(
        new Set(
          products
            .map(product =>
              product.category.trim()
            )
            .filter(Boolean)
        )
      ),
    ],
    [products]
  );

  const visibleProducts =
    useMemo(() => {
      const normalizedQuery =
        normalizeSearch(query);

      return products
        .filter(product => {
          const matchesCategory =
            category === "Todos" ||
            product.category === category;

          if (!matchesCategory) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return normalizeSearch(
            [
              product.name,
              product.category,
              product.description,
            ].join(" ")
          ).includes(normalizedQuery);
        })
        .sort(
          (productA, productB) =>
            Number(productB.featured) -
              Number(productA.featured) ||
            productA.featuredOrder -
              productB.featuredOrder
        );
    }, [
      products,
      category,
      query,
    ]);

  return (
    <main className="public-catalog-page">
      <header className="public-catalog-header">

        <nav aria-label="Navegação do catálogo">
          <a href="#produtos">
            Produtos
          </a>

          <a href="#como-funciona">
            Como funciona
          </a>
        </nav>

        <div className="public-catalog-actions">
          <ThemeToggle />

          <Link
            href="/"
            className="public-catalog-login"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="public-catalog-hero">
        <div className="public-catalog-hero-copy">
          <p className="eyebrow">
            CONHEÇA A FRIBOLOS
          </p>

          <h1>
            Doces que transformam
            <br />
            momentos em memórias.
          </h1>

          <p>
            Conheça nosso catálogo de produtos
            artesanais e encontre a escolha perfeita
            para sua ocasião.
          </p>

          <div className="public-catalog-hero-actions">
            <a href="#produtos">
              Ver produtos
              <span>↓</span>
            </a>

            <Link
              href="/"
              className="secondary"
            >
              Entrar para encomendar
            </Link>
          </div>

          <div className="public-catalog-benefits">
            <span>
              <i>♡</i>
              Feito para você
            </span>

            <span>
              <i>♨</i>
              Produção artesanal
            </span>

            <span>
              <i>✓</i>
              Acompanhamento do pedido
            </span>
          </div>
        </div>

        <div
          className="public-catalog-hero-visual"
          aria-hidden="true"
        >
          <div className="public-catalog-main-image">
            <img
              src="/BoloDecorado.webp"
              alt=""
            />
          </div>

          <div className="public-catalog-image-label">
            <span>✦</span>

            <div>
              <b>Feito com carinho</b>
              <small>
                Para momentos especiais
              </small>
            </div>
          </div>

          <span className="public-catalog-decoration decoration-one">
            ✦
          </span>

          <span className="public-catalog-decoration decoration-two">
            ✧
          </span>
        </div>
      </section>

      <section
        className="public-catalog-content"
        id="produtos"
      >
        <div className="public-catalog-title">
          <div>
            <p className="eyebrow">
              NOSSO CARDÁPIO
            </p>

            <h2>
              Feitos à mão,
              <br />
              pensados para você.
            </h2>
          </div>

          <p>
            Entre em sua conta para personalizar,
            adicionar ao carrinho e finalizar sua
            encomenda.
          </p>
        </div>

        <div className="public-catalog-toolbar">
          <div className="public-category-filters">
            {categories.map(
              currentCategory => (
                <button
                  type="button"
                  key={currentCategory}
                  className={
                    category ===
                    currentCategory
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setCategory(
                      currentCategory
                    )
                  }
                >
                  {currentCategory}
                </button>
              )
            )}
          </div>

          <label className="public-catalog-search">
            <span>⌕</span>

            <input
              type="search"
              value={query}
              onChange={event =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Buscar produtos..."
              aria-label="Buscar produtos"
            />
          </label>
        </div>

        {loading && (
          <div className="public-catalog-state">
            <span>♨</span>
            <h3>Preparando o catálogo...</h3>
            <p>
              Aguarde enquanto estamos carregamos nossas
              delícias.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="public-catalog-state error">
            <span>!</span>
            <h3>Não foi possível carregar</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          visibleProducts.length === 0 && (
            <div className="public-catalog-state">
              <span>⌕</span>
              <h3>
                Nenhum produto encontrado
              </h3>
              <p>
                Tente outra busca ou selecione uma
                categoria diferente.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("Todos");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          visibleProducts.length > 0 && (
            <div className="public-products-grid">
              {visibleProducts.map(product => (
                <article
                  className={`public-product-card ${
                    product.stock === 0
                      ? "sold-out"
                      : ""
                  }`}
                  key={product.id}
                >
                  <div className="public-product-visual">
                    <ProductVisual
                      product={product}
                    />

                    <div className="public-product-badges">
                      {product.featured && (
                        <span className="featured">
                          Destaque
                        </span>
                      )}

                      {product.customizable && (
                        <span>
                          Personalizável
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="public-product-content">
                    <small>
                      {product.category}
                    </small>

                    <h3>{product.name}</h3>

                    <p>
                      {product.description}
                    </p>

                    <div className="public-product-meta">
                      <span>
                        ◷ {product.preparation}
                      </span>

                      <span
                        className={
                          product.stock === 0
                            ? "unavailable"
                            : ""
                        }
                      >
                        {product.stock === 0
                          ? "Indisponível"
                          : "Disponível"}
                      </span>
                    </div>

                    <footer>
                      <div>
                        <small>
                          A partir de
                        </small>

                        <strong>
                          {product.price}
                        </strong>
                      </div>

                      <Link
                        href="/"
                        className={
                          product.stock === 0
                            ? "disabled"
                            : ""
                        }
                        aria-disabled={
                          product.stock === 0
                        }
                        onClick={event => {
                          if (
                            product.stock === 0
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        {product.stock === 0
                          ? "Esgotado"
                          : "Encomendar"}
                      </Link>
                    </footer>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>

      <section
        className="public-order-steps"
        id="como-funciona"
      >
        <div className="public-steps-heading">
          <p className="eyebrow">
            É SIMPLES
          </p>

          <h2>
            Sua encomenda em poucos passos
          </h2>
        </div>

        <div>
          <article>
            <span>01</span>
            <h3>Crie sua conta</h3>
            <p>
              Faça seu cadastro para começar sua
              encomenda.
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Escolha os produtos</h3>
            <p>
              Personalize e adicione seus favoritos
              ao carrinho.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Agende e acompanhe</h3>
            <p>
              Escolha a data e acompanhe todas as
              etapas.
            </p>
          </article>
        </div>

        <Link href="/">
          Entrar ou criar minha conta
          <span>→</span>
        </Link>
      </section>

      <footer className="public-catalog-footer">
        <div className="public-catalog-brand">
          <img
            src="/FaviconFribolos.png"
            alt=""
          />

          <div>
            <strong>
              Fri<em>Bolos</em>
            </strong>

            <small>
              Encomendas feitas com carinho
            </small>
          </div>
        </div>

        <p>
          © {new Date().getFullYear()} FriBolos.
          Todos os direitos reservados.
        </p>

        <Link href="/">
          Área do cliente
        </Link>
      </footer>
    </main>
  );
}