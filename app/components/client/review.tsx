"use client";

import {
  useState,
  type FormEvent,
} from "react";

import type {
  ClientOrderRow,
  Product,
} from "../../types";

import { formatDeliveryDate } from "../../lib/formatters";

export function Review({
  orders,
  products,
  reviewed,
  stars,
  setStars,
  loading,
  error,
  onSubmit,
}: {
  orders: ClientOrderRow[];
  products: Product[];
  reviewed: boolean;
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

  const selectedOrder =
    orders.find(
      order => order.id === selectedOrderId
    ) ||
    orders[0] ||
    null;

  if (reviewed) {
    return (
      <div className="success-state review-success">
        <span>★</span>

        <h1>Obrigado pela avaliação!</h1>

        <p>
          Sua opinião ajuda a confeitaria a tornar
          cada experiência ainda mais especial.
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <>
        <div className="client-page-title">
          <p className="eyebrow">AVALIAÇÃO</p>
          <h1>Como foi sua experiência?</h1>

          <span>
            Avalie um pedido já concluído.
          </span>
        </div>

        <div className="empty-cart">
          <span>★</span>
          <h3>Nenhum pedido para avaliar</h3>

          <p>
            Quando um pedido for marcado como
            entregue, ele ficará disponível aqui.
          </p>
        </div>
      </>
    );
  }

  const orderDescription =
    selectedOrder?.order_items
      .map(
        item =>
          `${item.quantity}× ${item.product_name}`
      )
      .join(", ") || "Pedido";

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

    if (!selectedOrder) {
      return;
    }

    const data = new FormData(
      event.currentTarget
    );

    await onSubmit(
      selectedOrder.id,
      String(data.get("comment") || "")
    );
  }

  return (
    <>
      <div className="client-page-title">
        <p className="eyebrow">AVALIAÇÃO</p>
        <h1>Como foi sua experiência?</h1>

        <span>
          Avalie um pedido já concluído.
        </span>
      </div>

      <form
        className="panel review-card"
        onSubmit={submit}
      >
        {orders.length > 1 && (
          <label>
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
              }}
            >
              {orders.map(order => (
                <option
                  key={order.id}
                  value={order.id}
                >
                  Pedido #{order.order_number}
                </option>
              ))}
            </select>
          </label>
        )}

        {selectedOrder && (
          <div className="review-product">
            {reviewProductImage ? (
              <img
                src={reviewProductImage}
                alt={orderDescription}
              />
            ) : (
              <span>🥧</span>
            )}

            <div>
              <small>
                PEDIDO #{selectedOrder.order_number}
              </small>

              <h2>{orderDescription}</h2>

              <p>
                Entregue em{" "}
                {formatDeliveryDate(
                  selectedOrder.delivery_date
                )}
              </p>
            </div>
          </div>
        )}

        <label>
          Sua nota

          <div className="stars">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                type="button"
                key={rating}
                className={
                  rating <= stars
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setStars(rating)
                }
                aria-label={`${rating} estrelas`}
              >
                ★
              </button>
            ))}
          </div>
        </label>

        <label>
          Conte como foi

          <textarea
            required
            maxLength={2000}
            name="comment"
            placeholder="Sabor, apresentação, atendimento..."
          />
        </label>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <button
          className="primary"
          disabled={!stars || loading}
        >
          {loading
            ? "Enviando avaliação..."
            : "Enviar avaliação"}
        </button>
      </form>
    </>
  );
}