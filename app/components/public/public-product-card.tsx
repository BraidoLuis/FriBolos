import Link from "next/link";

import type {
  Product,
} from "../../types";

import {
  ProductVisual,
} from "../ui";

export function PublicProductCard({
  product,
  orderHref = "/?entrar=1",
}: {
  product: Product;
  orderHref?: string;
}) {
  const unavailable =
    product.stock === 0;

  return (
    <article
      className={`public-product-card ${
        unavailable
          ? "sold-out"
          : ""
      }`}
    >
      <div className="public-product-visual">
        <ProductVisual
          product={product}
        />

        <span className="illustrative-image-label">
          Imagem meramente ilustrativa
        </span>

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

        <p>{product.description}</p>

        <div className="public-product-meta">
          <span>
            ◷ {product.preparation}
          </span>

          <span
            className={
              unavailable
                ? "unavailable"
                : ""
            }
          >
            {unavailable
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
            href={orderHref}
            className={
              unavailable
                ? "disabled"
                : ""
            }
            aria-disabled={unavailable}
            tabIndex={
              unavailable
                ? -1
                : undefined
            }
            onClick={event => {
              if (unavailable) {
                event.preventDefault();
              }
            }}
          >
            {unavailable
              ? "Esgotado"
              : "Encomendar"}
          </Link>
        </footer>
      </div>
    </article>
  );
}