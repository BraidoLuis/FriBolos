"use client";

import type {
  CartItem,
  Product,
} from "../../types";

import {
  money,
  priceNumber,
} from "../../lib/formatters";

import { ProductVisual } from "../ui";

type MiniCartProps = {
  items: CartItem[];
  onClose: () => void;

  onQuantity: (
    id: Product["id"],
    delta: number
  ) => void;

  onCheckout: () => void;
  onCatalog: () => void;
};

export function MiniCart({
  items,
  onClose,
  onQuantity,
  onCheckout,
  onCatalog,
}: MiniCartProps) {
  const total = items.reduce(
    (sum, item) =>
      sum +
      priceNumber(item.product.price) *
        item.quantity,
    0
  );

  return (
    <div
      className="minicart-backdrop"
      onMouseDown={event => {
        if (
          event.currentTarget ===
          event.target
        ) {
          onClose();
        }
      }}
    >
      <aside
        className="minicart"
        role="dialog"
        aria-modal="true"
        aria-label="Seu carrinho"
      >
        <header>
          <div>
            <p className="eyebrow">
              SUA SELEÇÃO
            </p>

            <h2>Carrinho</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar carrinho"
          >
            ×
          </button>
        </header>

        {items.length === 0 ? (
          <div className="empty-cart">
            <span>🧁</span>

            <h3>
              Seu carrinho está vazio
            </h3>

            <p>
              Escolha suas delícias no
              catálogo para montar o pedido.
            </p>

            <button
              type="button"
              onClick={onCatalog}
            >
              Ver catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="minicart-items">
              {items.map(item => (
                <article
                  key={item.product.id}
                >
                  <ProductVisual
                    product={item.product}
                  />

                  <div className="cart-item-copy">
                    <small>
                      {item.product.category}
                    </small>

                    <h3>
                      {item.product.name}
                    </h3>

                    <b>
                      {money(
                        priceNumber(
                          item.product.price
                        ) * item.quantity
                      )}
                    </b>

                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() =>
                          onQuantity(
                            item.product.id,
                            -1
                          )
                        }
                        aria-label={`Diminuir ${item.product.name}`}
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          onQuantity(
                            item.product.id,
                            1
                          )
                        }
                        aria-label={`Aumentar ${item.product.name}`}
                      >
                        ＋
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="remove-item"
                    onClick={() =>
                      onQuantity(
                        item.product.id,
                        -item.quantity
                      )
                    }
                    aria-label={`Remover ${item.product.name}`}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>

            <footer>
              <div>
                <span>Subtotal</span>
                <b>{money(total)}</b>
              </div>

              <small>
                A forma de recebimento, a
                data e o horário serão
                escolhidos na próxima etapa.
              </small>

              <button
                type="button"
                className="checkout-cart"
                onClick={onCheckout}
              >
                Finalizar pedido
                <span>→</span>
              </button>

              <button
                type="button"
                className="continue-shopping"
                onClick={onCatalog}
              >
                Continuar comprando
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}