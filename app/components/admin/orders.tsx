"use client";

import {
  useMemo,
  useState,
} from "react";

import { money } from "../../lib/formatters";

import type {
  AppOrder,
  OrderFilter,
} from "../../types";

import { PanelHead } from "../ui";

export function Orders({  orders,  openModal,  onStatus,  updatingOrderId,  onResolveRequest,  resolvingRequestId,}: {  orders: AppOrder[];  openModal: () => void;  onStatus: (    databaseId: string,    status: string  ) => Promise<void>;  updatingOrderId: string | null;  onResolveRequest: (    order: AppOrder,    decision: "approved" | "rejected"  ) => Promise<void>;  resolvingRequestId: string | null;}) {
  const [
    activeFilter,
    setActiveFilter,
  ] = useState<OrderFilter>("all");

  const currentDate = new Date();

  const todayDate = [
    currentDate.getFullYear(),
    String(
      currentDate.getMonth() + 1
    ).padStart(2, "0"),
    String(
      currentDate.getDate()
    ).padStart(2, "0"),
  ].join("-");

  const visibleOrders = useMemo(() => {
    if (activeFilter === "today") {
      return orders.filter(
        order =>
          order.deliveryDateRaw ===
          todayDate
      );
    }

    if (activeFilter === "requests") {
      return orders.filter(
        order =>
          order.requestStatus ===
          "pending"
      );
    }

    return orders;
  }, [
    orders,
    activeFilter,
    todayDate,
  ]);

  return (
    <div className="content">
      <div className="page-actions">
        <div className="tabs">
          <button
            type="button"
            className={
              activeFilter === "all"
                ? "selected"
                : ""
            }
            onClick={() =>
              setActiveFilter("all")
            }
          >
            Todos
          </button>

          <button
            type="button"
            className={
              activeFilter === "today"
                ? "selected"
                : ""
            }
            onClick={() =>
              setActiveFilter("today")
            }
          >
            Hoje
          </button>

          <button
            type="button"
            className={
              activeFilter === "requests"
                ? "selected"
                : ""
            }
            onClick={() =>
              setActiveFilter("requests")
            }
          >
            Solicitações
          </button>
        </div>
        <button className="new-order" onClick={openModal}>＋ Novo pedido</button>
      </div>
      <section className="panel full-table">
        <PanelHead icon="▣" title="Acompanhar pedidos" subtitle={`${visibleOrders.length} pedidos encontrados`} />
        <div className="admin-orders-list">
          {visibleOrders.length === 0 && (
            <div className="empty-cart">
              <span>▣</span>

              <h3>
                Nenhum pedido encontrado
              </h3>

              <p>
                {activeFilter === "today"
                  ? "Não existem entregas ou retiradas para hoje."
                  : activeFilter === "requests"
                    ? "Não existem solicitações pendentes."
                    : "Nenhum pedido foi cadastrado."}
              </p>
            </div>
          )}
          {visibleOrders.map(o => (
            <article key={o.id}>
              <div className="order-id"><span className="initials">{o.initials}</span><div><small>{o.id}</small><b>{o.client}</b></div></div>
              <div><small>Pedido</small><b>{o.item}</b>{o.request && <span className="request-badge">{o.request}</span>}</div>
              <div className="order-fulfillment">
                <small>
                  {o.fulfillmentType === "delivery"
                    ? "Entrega"
                    : "Retirada"}
                </small>

                <b>
                  {o.date}, {o.time}
                </b>

                {o.fulfillmentType === "delivery" &&
                  o.deliveryAddress && (
                    <span>{o.deliveryAddress}</span>
                  )}
              </div>

              <div className="order-value-breakdown">
                <small>Valor</small>
                <b>{o.value}</b>

                {Number(o.deliveryFeeAmount || 0) > 0 && (
                  <span>
                    Taxa:{" "}
                    {money(
                      Number(o.deliveryFeeAmount)
                    )}
                  </span>
                )}
              </div>
              <select
                value={o.status}
                disabled={
                  updatingOrderId === o.databaseId ||
                  resolvingRequestId === o.databaseId
                }
                onChange={e =>
                  onStatus(
                    o.databaseId,
                    e.target.value
                  )
                }
              >
                <option>Aguardando</option>
                <option>Confirmado</option>
                <option>Aguardando pagamento</option>
                <option>Em produção</option>
                <option>Pronto</option>
                <option>Entregue</option>            
              </select>
              {o.request && (
                <div className="request-actions">
                  <button
                    className="approve-request"
                    disabled={
                      resolvingRequestId ===
                      o.databaseId
                    }
                    onClick={() =>
                      onResolveRequest(o, "approved")
                    }
                  >
                    {resolvingRequestId === o.databaseId
                      ? "Processando..."
                      : "Aprovar"}
                  </button>

                  <button
                    className="secondary"
                    disabled={
                      resolvingRequestId ===
                      o.databaseId
                    }
                    onClick={() =>
                      onResolveRequest(o, "rejected")
                    }
                  >
                    Rejeitar
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}