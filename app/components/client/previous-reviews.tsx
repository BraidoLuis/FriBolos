"use client";

import type {
  ClientOrderRow,
  Product,
} from "../../types";

function formatReviewDate(
  createdAt: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(new Date(createdAt));
}

export function PreviousReviews({
  orders,
  products,
}: {
  orders: ClientOrderRow[];
  products: Product[];
}) {
  if (orders.length === 0) {
    return null;
  }

  return (
    <section className="previous-reviews">
      <header className="previous-reviews-heading">
        <div>
          <p className="eyebrow">
            SEU HISTÓRICO
          </p>

          <h2>Avaliações anteriores</h2>

          <p>
            Veja as opiniões que você já
            compartilhou sobre suas encomendas.
          </p>
        </div>

        <span>
          {orders.length}{" "}
          {orders.length === 1
            ? "avaliação"
            : "avaliações"}
        </span>
      </header>

      <div className="previous-reviews-list">
        {orders.map(order => {
          const review =
            order.reviews;

          if (!review) {
            return null;
          }

          const orderDescription =
            order.order_items
              .map(
                item =>
                  `${item.quantity}× ${item.product_name}`
              )
              .join(", ");

          const productImage =
            order.order_items
              .map(item => {
                const product =
                  products.find(
                    currentProduct =>
                      String(
                        currentProduct.id
                      ) ===
                        String(
                          item.product_id
                        ) ||
                      currentProduct.name ===
                        item.product_name
                  );

                return (
                  product?.image ||
                  item.products?.[0]
                    ?.image_url ||
                  ""
                );
              })
              .find(Boolean) || "";

          const rating = Math.max(
            1,
            Math.min(
              5,
              Number(review.rating)
            )
          );

          return (
            <article
              key={review.id}
              className="previous-review-card"
            >
              <div className="previous-review-product">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={orderDescription}
                  />
                ) : (
                  <span>🧁</span>
                )}
              </div>

              <div className="previous-review-content">
                <div className="previous-review-meta">
                  <span>
                    PEDIDO #{order.order_number}
                  </span>

                  <time
                    dateTime={
                      review.created_at
                    }
                  >
                    {formatReviewDate(
                      review.created_at
                    )}
                  </time>
                </div>

                <h3>{orderDescription}</h3>

                <div
                  className="previous-review-stars"
                  aria-label={`${rating} de 5 estrelas`}
                >
                  <span>
                    {"★".repeat(rating)}
                  </span>

                  <i>
                    {"★".repeat(5 - rating)}
                  </i>
                </div>

                <blockquote>
                  “{review.comment}”
                </blockquote>
              </div>

              <div className="previous-review-status">
                <span>✓</span>
                Avaliação enviada
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}