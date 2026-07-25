"use client";

import type {
  Dispatch,
  FormEvent,
  SetStateAction,
} from "react";

import { money } from "../../lib/formatters";

import type {
  ClientProfileRow,
  Product,
} from "../../types";

type FulfillmentType =
  | "delivery"
  | "pickup";

type AdminOrderModalProps = {
  products: Product[];
  clients: ClientProfileRow[];

  clientsLoading: boolean;
  saving: boolean;

  deliveryFee: number;

  fulfillmentType:
    FulfillmentType;

  setFulfillmentType: Dispatch<
    SetStateAction<FulfillmentType>
  >;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => Promise<void>;

  onClose: () => void;
};

export function AdminOrderModal({
  products,
  clients,
  clientsLoading,
  saving,
  deliveryFee,
  fulfillmentType,
  setFulfillmentType,
  onSubmit,
  onClose,
}: AdminOrderModalProps) {
  function closeModal() {
    setFulfillmentType("pickup");
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={event => {
        if (
          event.currentTarget ===
          event.target
        ) {
          closeModal();
        }
      }}
    >
      <form
        className="modal"
        onSubmit={onSubmit}
      >
        <div className="modal-title">
          <div>
            <p>NOVO PEDIDO</p>

            <h2>
              Adicionar encomenda
            </h2>
          </div>

          <button
            type="button"
            onClick={closeModal}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <div className="form-grid">
          <label className="wide">
            Cliente

            <select
              required
              name="clientId"
              defaultValue=""
              disabled={clientsLoading}
            >
              <option
                value=""
                disabled
              >
                {clientsLoading
                  ? "Carregando clientes..."
                  : "Selecione um cliente"}
              </option>

              {clients.map(client => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.full_name}

                  {client.phone
                    ? ` — ${client.phone}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="wide">
            Produto

            <select
              required
              name="productId"
              defaultValue=""
            >
              <option
                value=""
                disabled
              >
                Selecione um produto
              </option>

              {products
                .filter(
                  product =>
                    product.active &&
                    !product.archived
                )
                .map(product => (
                  <option
                    key={product.id}
                    value={String(
                      product.id
                    )}
                    disabled={
                      product.stock <= 0
                    }
                  >
                    {product.name}
                    {" — "}
                    {product.price}
                    {" — estoque: "}
                    {product.stock}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Quantidade

            <input
              required
              name="quantity"
              type="number"
              min="1"
              step="1"
              defaultValue="1"
            />
          </label>

          <label>
            Status inicial

            <select
              required
              name="status"
              defaultValue="confirmed"
            >
              <option value="pending">
                Aguardando
              </option>

              <option value="confirmed">
                Confirmado
              </option>

              <option value="in_production">
                Em produção
              </option>
            </select>
          </label>

          <label>
            Forma de recebimento

            <select
              required
              name="fulfillmentType"
              value={fulfillmentType}
              onChange={event =>
                setFulfillmentType(
                  event.target.value as
                    FulfillmentType
                )
              }
            >
              <option value="pickup">
                Retirada no local
              </option>

              <option value="delivery">
                Entrega
                {deliveryFee > 0
                  ? ` — ${money(
                      deliveryFee
                    )}`
                  : ""}
              </option>
            </select>
          </label>

          {fulfillmentType ===
            "delivery" && (
            <label className="wide">
              Endereço para entrega

              <input
                required
                name="deliveryAddress"
                placeholder="Rua, número, bairro e complemento"
              />
            </label>
          )}

          <label>
            Data da entrega

            <input
              name="deliveryDate"
              type="date"
            />
          </label>

          <label>
            Horário

            <input
              name="deliveryTime"
              type="time"
            />
          </label>

          <label className="wide">
            Observações

            <textarea
              name="notes"
              placeholder="Detalhes, decoração, sabor, restrições..."
            />
          </label>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary"
            onClick={closeModal}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="primary"
            disabled={
              saving ||
              clientsLoading
            }
          >
            {saving
              ? "Salvando pedido..."
              : "Salvar pedido"}
          </button>
        </div>
      </form>
    </div>
  );
}