"use client";

import type { AppOrder } from "../../types";

import { Status } from "../ui";

export function Production({
  orders,
  onStatus,
  updatingOrderId,
}: {
  orders: AppOrder[];

  onStatus: (
    databaseId: string,
    newStatusLabel: string
  ) => Promise<void>;

  updatingOrderId: string | null;
}) {
  const stages = [
    {
      label: "Confirmado",
      previous: null,
      next: "Em produção",
      nextAction: "Iniciar produção",
    },
    {
      label: "Em produção",
      previous: "Confirmado",
      next: "Pronto",
      nextAction: "Marcar como pronto",
    },
    {
      label: "Pronto",
      previous: "Em produção",
      next: "Entregue",
      nextAction: "Marcar como entregue",
    },
    {
      label: "Entregue",
      previous: "Pronto",
      next: null,
      nextAction: null,
    },
  ];

  const productionOrders = orders.filter(
    order =>
      order.statusCode !== "cancelled" &&
      order.statusCode !== "pending" &&
      order.statusCode !==
        "awaiting_payment"
  );

  return (
    <div className="content">
      <div className="kanban">
        {stages.map(stage => {
          const stageOrders =
            productionOrders.filter(
              order =>
                order.status ===
                stage.label
            );

          return (
            <section
              className="kanban-col"
              key={stage.label}
            >
              <header>
                <h3>{stage.label}</h3>

                <b>
                  {stageOrders.length}
                </b>
              </header>

              {stageOrders.length === 0 ? (
                <div className="kanban-empty">
                  <span>♨</span>

                  <small>
                    Nenhum pedido nesta etapa
                  </small>
                </div>
              ) : (
                stageOrders.map(order => {
                  const isUpdating =
                    updatingOrderId ===
                    order.databaseId;

                  return (
                    <article
                      className="task"
                      key={order.databaseId}
                    >
                      <small>
                        {order.id} •{" "}
                        {order.time}
                      </small>

                      <h4>{order.item}</h4>

                      <p>{order.client}</p>

                      <div className="task-status-row">
                        <Status>
                          {order.status}
                        </Status>

                        <span className="initials">
                          {order.initials}
                        </span>
                      </div>

                      <div className="task-actions">
                        {stage.previous && (
                          <button
                            type="button"
                            className="task-back"
                            disabled={isUpdating}
                            onClick={() =>
                              onStatus(
                                order.databaseId,
                                stage.previous!
                              )
                            }
                            title={`Voltar para ${stage.previous}`}
                          >
                            ←
                          </button>
                        )}

                        {stage.next &&
                          stage.nextAction && (
                            <button
                              type="button"
                              className="task-next"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                onStatus(
                                  order.databaseId,
                                  stage.next!
                                )
                              }
                            >
                              {isUpdating
                                ? "Atualizando..."
                                : stage.nextAction}
                            </button>
                          )}
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}