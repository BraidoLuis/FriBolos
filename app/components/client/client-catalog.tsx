"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  Product,
} from "../../types";

import {
  ProductVisual,
} from "../ui";

type CatalogOrder =
  | "featured"
  | "lowest-price"
  | "highest-price"
  | "alphabetical";

type ClientCatalogProps = {
  products: Product[];

  onChoose: (
    product: Product
  ) => void;

  onAdd: (
    product: Product
  ) => void;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function productPriceNumber(
  price: Product["price"]
) {
  if (typeof price === "number") {
    return price;
  }

  const normalizedPrice = String(price)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsedPrice =
    Number(normalizedPrice);

  return Number.isFinite(parsedPrice)
    ? parsedPrice
    : 0;
}

export function ClientCatalog({
  products,
  onChoose,
  onAdd,
}: ClientCatalogProps) {
  const [category, setCategory] =
    useState("Todos");

  const [query, setQuery] =
    useState("");

  const [order, setOrder] =
    useState<CatalogOrder>(
      "featured"
    );

  const categories = useMemo(() => {
    const productCategories =
      products
        .map(product =>
          product.category.trim()
        )
        .filter(Boolean);

    return [
      "Todos",
      ...Array.from(
        new Set(productCategories)
      ).sort((a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
      ),
    ];
  }, [products]);

  const categoryCounts =
    useMemo(() => {
      const counts =
        new Map<string, number>();

      counts.set(
        "Todos",
        products.length
      );

      products.forEach(product => {
        counts.set(
          product.category,
          (
            counts.get(
              product.category
            ) || 0
          ) + 1
        );
      });

      return counts;
    }, [products]);

  const visibleProducts =
    useMemo(() => {
      const normalizedQuery =
        normalizeText(query);

      const filteredProducts =
        products.filter(product => {
          const matchesCategory =
            category === "Todos" ||
            product.category ===
              category;

          if (!matchesCategory) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          const searchableContent =
            normalizeText(
              [
                product.name,
                product.category,
                product.description,
              ].join(" ")
            );

          return searchableContent.includes(
            normalizedQuery
          );
        });

      return [
        ...filteredProducts,
      ].sort((first, second) => {
        if (
          order === "lowest-price"
        ) {
          return (
            productPriceNumber(
              first.price
            ) -
            productPriceNumber(
              second.price
            )
          );
        }

        if (
          order === "highest-price"
        ) {
          return (
            productPriceNumber(
              second.price
            ) -
            productPriceNumber(
              first.price
            )
          );
        }

        if (
          order === "alphabetical"
        ) {
          return first.name.localeCompare(
            second.name,
            "pt-BR"
          );
        }

        return (
          Number(second.featured) -
            Number(first.featured) ||
          first.featuredOrder -
            second.featuredOrder
        );
      });
    }, [
      products,
      category,
      query,
      order,
    ]);

  const availableProductsCount =
    products.filter(
      product => product.stock > 0
    ).length;

  function clearFilters() {
    setCategory("Todos");
    setQuery("");
    setOrder("featured");
  }

  return (
    <div className="client-catalog">
      <section className="catalog-hero">
        <div className="catalog-hero-copy">
          <p className="eyebrow">
            NOSSO CARDÁPIO
          </p>

          <h1>
            Feitos à mão,
            <br />
            pensados para você.
          </h1>

          <p>
            Encontre o doce perfeito,
            personalize sua encomenda e
            adicione quantos produtos quiser
            ao carrinho.
          </p>

          <div className="catalog-summary">
            <span>
              <b>{products.length}</b>
              opções no cardápio
            </span>

            <span>
              <b>
                {availableProductsCount}
              </b>
              disponíveis agora
            </span>
          </div>
        </div>

        <div
          className="catalog-hero-decoration"
          aria-hidden="true"
        >
          <span className="catalog-hero-logo">
            <img
              src="/FaviconFribolos.png"
              alt=""
            />
          </span>
          <strong>
            Preparados com carinho
          </strong>
          <small>
            Produção artesanal FriBolos
          </small>
        </div>
      </section>

      <section className="catalog-toolbar">
        <label className="catalog-search">
          <span aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            value={query}
            onChange={event =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Buscar bolos, doces e categorias..."
            aria-label="Buscar produtos no catálogo"
          />

          {query && (
            <button
              type="button"
              onClick={() =>
                setQuery("")
              }
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
        </label>

        <label className="catalog-order">
          <span>Ordenar por</span>

          <select
            value={order}
            onChange={event =>
              setOrder(
                event.target
                  .value as CatalogOrder
              )
            }
            aria-label="Ordenar produtos"
          >
            <option value="featured">
              Destaques
            </option>

            <option value="lowest-price">
              Menor preço
            </option>

            <option value="highest-price">
              Maior preço
            </option>

            <option value="alphabetical">
              Nome de A a Z
            </option>
          </select>
        </label>
      </section>

      <div className="catalog-filters">
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
              <span>
                {currentCategory}
              </span>

              <b>
                {categoryCounts.get(
                  currentCategory
                ) || 0}
              </b>
            </button>
          )
        )}
      </div>

      <div className="catalog-results-heading">
        <div>
          <h2>
            {category === "Todos"
              ? "Todos os produtos"
              : category}
          </h2>

          <p>
            {visibleProducts.length === 1
              ? "1 produto encontrado"
              : `${visibleProducts.length} produtos encontrados`}
          </p>
        </div>

        {(query ||
          category !== "Todos") && (
          <button
            type="button"
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {visibleProducts.length > 0 ? (
        <div className="client-catalog-grid">
          {visibleProducts.map(
            product => {
              const soldOut =
                product.stock === 0;

              return (
                <article
                  className={[
                    "catalog-card",
                    soldOut
                      ? "sold-out"
                      : "",
                    product.featured
                      ? "featured"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={product.id}
                >
                  <div className="catalog-card-visual">
                    <ProductVisual
                      product={product}
                    />

                    <div className="catalog-card-badges">
                      {product.featured && (
                        <span className="catalog-featured-badge">
                          ★ Destaque
                        </span>
                      )}

                      {product.customizable && (
                        <span className="catalog-custom-badge">
                          Personalizável
                        </span>
                      )}

                      {soldOut && (
                        <span className="catalog-sold-out-badge">
                          Indisponível
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="catalog-card-content">
                    <header>
                      <small>
                        {product.category}
                      </small>

                      <h2>
                        {product.name}
                      </h2>

                      <p>
                        {product.description ||
                          "Uma opção preparada com todo o carinho da FriBolos."}
                      </p>
                    </header>

                    <div className="catalog-meta">
                      <span>
                        <i>◷</i>

                        <span>
                          <small>
                            Preparo
                          </small>

                          <b>
                            {product.preparation}
                          </b>
                        </span>
                      </span>

                      <span
                        className={
                          soldOut
                            ? "unavailable"
                            : ""
                        }
                      >
                        <i>
                          {soldOut
                            ? "×"
                            : "✓"}
                        </i>

                        <span>
                          <small>
                            Disponibilidade
                          </small>

                          <b>
                            {soldOut
                              ? "Esgotado"
                              : `${product.stock} em estoque`}
                          </b>
                        </span>
                      </span>
                    </div>

                    <footer>
                      <div className="catalog-price">
                        <small>
                          A partir de
                        </small>

                        <strong>
                          {product.price}
                        </strong>
                      </div>

                      <div className="catalog-actions">
                        {product.customizable && (
                          <button
                            type="button"
                            className="customize-product"
                            disabled={soldOut}
                            onClick={() =>
                              onChoose(
                                product
                              )
                            }
                          >
                            Personalizar
                          </button>
                        )}

                        <button
                          type="button"
                          className="add-product"
                          disabled={soldOut}
                          onClick={() =>
                            onAdd(product)
                          }
                        >
                          {soldOut
                            ? "Esgotado"
                            : "＋ Carrinho"}
                        </button>
                      </div>
                    </footer>
                  </div>
                </article>
              );
            }
          )}
        </div>
      ) : (
        <section className="catalog-empty">
          <span>⌕</span>

          <p className="eyebrow">
            NENHUM RESULTADO
          </p>

          <h2>
            Não encontramos esse doce.
          </h2>

          <p>
            Tente buscar outro nome ou
            escolher uma categoria diferente.
          </p>

          <button
            type="button"
            onClick={clearFilters}
          >
            Ver todo o cardápio
          </button>
        </section>
      )}
    </div>
  );
}