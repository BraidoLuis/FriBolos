"use client";

import {
  useState,
  type FormEvent,
} from "react";

import type {
  ClientOrderRow,
  Product,
} from "../../types";

import {
  formatDeliveryDate,
} from "../../lib/formatters";
const REVIEW_COMMENT_MAX_LENGTH =
  200;
const ratingLabels: Record<
  number,
  string
> = {
  1: "Não gostei",
  2: "Poderia melhorar",
  3: "Foi uma boa experiência",
  4: "Gostei muito",
  5: "Foi perfeito!",
};

export function Review({
  orders,
  products,
  stars,
  setStars,
  loading,
  error,
  onSubmit,
}: {
  orders: ClientOrderRow[];
  products: Product[];
  stars: number;
  setStars: (rating: number) => void;
  loading: boolean;
  error: string;

  onSubmit: (
    orderId: string,
    comment: string
  ) => Promise<boolean>;
}) {
  const [
    selectedOrderId,
    setSelectedOrderId,
  ] = useState("");

  const [
    hoveredRating,
    setHoveredRating,
  ] = useState(0);

  const [
    comment,
    setComment,
  ] = useState("");

  const selectedOrder =
    orders.find(
      order =>
        order.id === selectedOrderId
    ) ||
    orders[0] ||
    null;

  const displayedRating =
    hoveredRating || stars;

  if (orders.length === 0) {
    return (
      <div className="client-review-page">
        <div className="client-page-title review-page-title">
          <div>
            <p className="eyebrow">
              AVALIAÇÃO
            </p>

            <h1>
              Como foi sua experiência?
            </h1>

            <span>
              Compartilhe sua opinião sobre
              uma encomenda concluída.
            </span>
          </div>

          <div
            className="review-title-decoration"
            aria-hidden="true"
          >
            ★
          </div>
        </div>

        <section className="review-feedback-state review-feedback-empty">
          <div className="review-feedback-icon">
            ☆
          </div>

          <h2>
            Nenhum pedido para avaliar
          </h2>

          <p>
            Quando uma encomenda for marcada
            como entregue, ela aparecerá aqui
            para que você possa contar como
            foi sua experiência.
          </p>

          <div className="review-empty-steps">
            <span>
              <i>1</i>
              Faça uma encomenda
            </span>

            <span>
              <i>2</i>
              Receba seu pedido
            </span>

            <span>
              <i>3</i>
              Compartilhe sua opinião
            </span>
          </div>
        </section>
      </div>
    );
  }

  const orderDescription =
    selectedOrder?.order_items
      .map(
        item =>
          `${item.quantity}× ${item.product_name}`
      )
      .join(", ") || "Pedido";

  const totalOrderItems =
    selectedOrder?.order_items.reduce(
      (total, item) =>
        total + Number(item.quantity),
      0
    ) || 0;

  const reviewProductImage =
    selectedOrder?.order_items
      .map(item => {
        const matchingProduct =
          products.find(
            product =>
              String(product.id) ===
                String(item.product_id) ||
              product.name ===
                item.product_name
          );

        return (
          matchingProduct?.image ||
          item.products?.[0]?.image_url ||
          ""
        );
      })
      .find(image => Boolean(image)) || "";

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedOrder ||
      !stars ||
      !comment.trim()
    ) {
      return;
    }

    const success = await onSubmit(
      selectedOrder.id,
      comment.trim()
    );

    if (!success) {
      return;
    }

    setComment("");
    setHoveredRating(0);
    setSelectedOrderId("");
  }

  return (
    <div className="client-review-page">
      <div className="client-page-title review-page-title">
        <div>
          <p className="eyebrow">
            SUA OPINIÃO IMPORTA
          </p>

          <h1>
            Como foi sua experiência?
          </h1>

          <span>
            Conte para nós o que tornou sua
            encomenda especial.
          </span>
        </div>

        <div
          className="review-title-decoration"
          aria-hidden="true"
        >
          ★
        </div>
      </div>

      <form
        className="review-layout"
        onSubmit={submit}
      >
        <aside className="review-order-column">
          <div className="review-section-heading">
            <span>1</span>

            <div>
              <small>
                SUA ENCOMENDA
              </small>

              <h2>
                Pedido avaliado
              </h2>
            </div>
          </div>

          {orders.length > 1 && (
            <label className="review-order-selector">
              Escolha o pedido

              <select
                value={
                  selectedOrder?.id || ""
                }
                onChange={event => {
                  setSelectedOrderId(
                    event.target.value
                  );

                  setStars(0);
                  setHoveredRating(0);
                  setComment("");
                }}
              >
                {orders.map(order => (
                  <option
                    key={order.id}
                    value={order.id}
                  >
                    Pedido #
                    {order.order_number}
                  </option>
                ))}
              </select>
            </label>
          )}

          {selectedOrder && (
            <article className="review-product-card">
              <div className="review-product-image">
                {reviewProductImage ? (
                  <img
                    src={
                      reviewProductImage
                    }
                    alt={
                      orderDescription
                    }
                  />
                ) : (
                  <span>🧁</span>
                )}
              </div>

              <div className="review-product-information">
                <span className="review-order-number">
                  PEDIDO #
                  {
                    selectedOrder.order_number
                  }
                </span>

                <h2>
                  {orderDescription}
                </h2>

                <p>
                  Entregue em{" "}
                  {formatDeliveryDate(
                    selectedOrder.delivery_date
                  )}
                </p>

                <div className="review-order-summary">
                  <span>
                    <b>
                      {totalOrderItems}
                    </b>

                    {totalOrderItems === 1
                      ? " item"
                      : " itens"}
                  </span>

                  <span>
                    <b>✓</b>
                    Pedido entregue
                  </span>
                </div>
              </div>
            </article>
          )}

          <div className="review-order-message">
            <span>♡</span>

            <p>
              Cada comentário nos ajuda a
              aperfeiçoar receitas, atendimento
              e apresentação.
            </p>
          </div>
        </aside>

        <section className="review-form-column">
          <div className="review-section-heading">
            <span>2</span>

            <div>
              <small>
                CONTE PARA NÓS
              </small>

              <h2>
                Avalie sua experiência
              </h2>
            </div>
          </div>

          <fieldset className="review-rating-field">
            <legend>
              Qual nota você daria?
            </legend>

            <div
              className="review-stars"
              onMouseLeave={() =>
                setHoveredRating(0)
              }
            >
              {[1, 2, 3, 4, 5].map(
                rating => (
                  <button
                    type="button"
                    key={rating}
                    className={
                      rating <=
                      displayedRating
                        ? "selected"
                        : ""
                    }
                    onMouseEnter={() =>
                      setHoveredRating(
                        rating
                      )
                    }
                    onFocus={() =>
                      setHoveredRating(
                        rating
                      )
                    }
                    onBlur={() =>
                      setHoveredRating(0)
                    }
                    onClick={() =>
                      setStars(rating)
                    }
                    aria-label={`${rating} ${
                      rating === 1
                        ? "estrela"
                        : "estrelas"
                    }`}
                    aria-pressed={
                      stars === rating
                    }
                  >
                    ★
                  </button>
                )
              )}
            </div>

            <div
              className={[
                "review-rating-label",
                displayedRating
                  ? "visible"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {displayedRating
                ? ratingLabels[
                    displayedRating
                  ]
                : "Selecione de 1 a 5 estrelas"}
            </div>
          </fieldset>

          <label className="review-comment-field">
            <span>
              <b>Conte como foi</b>

            <small>
              {comment.length}/
              {REVIEW_COMMENT_MAX_LENGTH}
            </small>
            </span>

            <textarea
              required
              minLength={3}
              maxLength={REVIEW_COMMENT_MAX_LENGTH}
              name="comment"
              value={comment}
              onChange={event =>
                setComment(
                  event.target.value
                )
              }
              placeholder="Conte sobre o sabor, a apresentação, o atendimento e o que mais chamou sua atenção..."
            />
          </label>

          {error && (
            <p className="form-error review-form-error">
              <span>!</span>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="review-submit"
            disabled={
              !stars ||
              comment.trim().length < 3 ||
              loading
            }
          >
            <span>
              {loading
                ? "Enviando avaliação..."
                : "Enviar minha avaliação"}
            </span>

            {!loading && <b>→</b>}
          </button>

          <p className="review-privacy">
            Sua avaliação poderá ser exibida
            publicamente, sem divulgar seus
            dados pessoais.
          </p>
        </section>
      </form>
    </div>
  );
}