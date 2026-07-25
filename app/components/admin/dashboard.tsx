"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import { money } from "../../lib/formatters";

import type {
  AppOrder,
  DashboardPaymentRow,
  Screen,
} from "../../types";

import {
  Kpi,
  PanelHead,
  Status,
} from "../ui";

export function Dashboard({
  setScreen,
  openModal,
  orders,
}: {
  setScreen: (screen: Screen) => void;
  openModal: () => void;
  orders: AppOrder[];
}) {
  const [payments, setPayments] =
    useState<DashboardPaymentRow[]>([]);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  function localDateKey(date: Date) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    let componentActive = true;

    async function loadDashboardPayments() {
      const {
        data,
        error,
      } = await supabase
        .from("payments")
        .select(`
          amount,
          status,
          paid_at,
          refunded_at
        `);

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar resumo financeiro:",
          error
        );

        setDashboardLoading(false);
        return;
      }

      setPayments(
        (data || []) as DashboardPaymentRow[]
      );

      setDashboardLoading(false);
    }

    loadDashboardPayments();

    return () => {
      componentActive = false;
    };
  }, []);

  const summary = useMemo(() => {
    const today = localDateKey(
      new Date()
    );

    const ordersToday = orders.filter(
      order =>
        localDateKey(
          new Date(order.createdAt)
        ) === today
    );

    const inProduction = orders.filter(
      order =>
        order.statusCode ===
        "in_production"
    );

    const readyOrders = orders.filter(
      order =>
        order.statusCode === "ready"
    );

    const activeOrders = orders.filter(
      order =>
        order.statusCode !==
          "cancelled" &&
        order.statusCode !==
          "completed"
    );

    const revenueToday =
      payments.reduce(
        (total, payment) => {
          let result = total;

          if (
            payment.paid_at &&
            localDateKey(
              new Date(payment.paid_at)
            ) === today
          ) {
            result += Number(
              payment.amount
            );
          }

          if (
            payment.refunded_at &&
            localDateKey(
              new Date(
                payment.refunded_at
              )
            ) === today
          ) {
            result -= Number(
              payment.amount
            );
          }

          return result;
        },
        0
      );

    const upcomingOrders = orders
      .filter(
        order =>
          order.statusCode !==
            "cancelled" &&
          order.statusCode !==
            "completed"
      )
      .sort((firstOrder, secondOrder) => {
        const firstDate =
          firstOrder.deliveryDateRaw
            ? `${firstOrder.deliveryDateRaw}T${
                firstOrder.time ===
                "A combinar"
                  ? "23:59"
                  : firstOrder.time
              }`
            : "9999-12-31T23:59";

        const secondDate =
          secondOrder.deliveryDateRaw
            ? `${secondOrder.deliveryDateRaw}T${
                secondOrder.time ===
                "A combinar"
                  ? "23:59"
                  : secondOrder.time
              }`
            : "9999-12-31T23:59";

        return firstDate.localeCompare(
          secondDate
        );
      })
      .slice(0, 3);

    const todayAgenda = orders
      .filter(
        order =>
          order.deliveryDateRaw ===
            today &&
          order.statusCode !==
            "cancelled" &&
          order.statusCode !==
            "completed"
      )
      .sort((firstOrder, secondOrder) =>
        firstOrder.time.localeCompare(
          secondOrder.time
        )
      )
      .slice(0, 3);

    const productionOrders =
      orders.filter(order =>
        [
          "confirmed",
          "in_production",
          "ready",
          "completed",
        ].includes(order.statusCode)
      );

    const productionWeights: Record<
      string,
      number
    > = {
      confirmed: 25,
      in_production: 60,
      ready: 90,
      completed: 100,
    };

    const productionProgress =
      productionOrders.length > 0
        ? Math.round(
            productionOrders.reduce(
              (total, order) =>
                total +
                (productionWeights[
                  order.statusCode
                ] || 0),
              0
            ) /
              productionOrders.length
          )
        : 0;

    const productionStages = [
      {
        name: "Confirmados",
        count: orders.filter(
          order =>
            order.statusCode ===
            "confirmed"
        ).length,
        progress: 25,
      },
      {
        name: "Em produção",
        count: inProduction.length,
        progress: 60,
      },
      {
        name: "Prontos",
        count: readyOrders.length,
        progress: 90,
      },
    ];

    return {
      ordersToday: ordersToday.length,
      revenueToday,
      inProduction:
        inProduction.length,
      readyOrders:
        readyOrders.length,
      activeOrders:
        activeOrders.length,
      upcomingOrders,
      todayAgenda,
      productionProgress,
      productionStages,
    };
  }, [orders, payments]);

  const nextReadyOrder =
    summary.readyOrders > 0
      ? orders
          .filter(
            order =>
              order.statusCode ===
              "ready"
          )
          .sort((firstOrder, secondOrder) =>
            firstOrder.time.localeCompare(
              secondOrder.time
            )
          )[0]
      : null;

  return (
    <div className="content">
      <div className="kpis">
        <Kpi
          icon="▢"
          label="Pedidos hoje"
          value={String(
            summary.ordersToday
          )}
          note={`${summary.activeOrders} pedido(s) ativo(s)`}
          tone="green"
        />

        <Kpi
          icon="▥"
          label="Faturamento hoje"
          value={
            dashboardLoading
              ? "Carregando..."
              : money(
                  summary.revenueToday
                )
          }
          note="Pagamentos menos reembolsos"
          tone="green"
        />

        <Kpi
          icon="♨"
          label="Em produção"
          value={String(
            summary.inProduction
          )}
          note="Pedidos sendo preparados"
          tone="gold"
        />

        <Kpi
          icon="▭"
          label="Aguardando entrega"
          value={String(
            summary.readyOrders
          )}
          note={
            nextReadyOrder
              ? `Próximo: ${nextReadyOrder.time}`
              : "Nenhum pedido pronto"
          }
          tone="gold"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel orders-panel">
          <PanelHead
            icon="▣"
            title="Próximos pedidos"
            action="Ver todos"
            onClick={() =>
              setScreen("Pedidos")
            }
          />

          {summary.upcomingOrders.length >
          0 ? (
            <OrderTable
              orders={
                summary.upcomingOrders
              }
            />
          ) : (
            <div className="empty-notifications">
              <span>▢</span>
              <p>
                Nenhum pedido pendente.
              </p>
            </div>
          )}

          <button
            className="quick-add"
            onClick={openModal}
          >
            ＋ Adicionar novo pedido
          </button>
        </section>

        <div className="stack">
          <section className="panel production-card">
            <PanelHead
              icon="♨"
              title="Produção atual"
              subtitle={`${summary.productionProgress}% concluída`}
            />

            <div className="big-progress">
              <i
                style={{
                  width:
                    `${summary.productionProgress}%`,
                }}
              />
            </div>

            {summary.productionStages.map(
              stage => (
                <div
                  className="progress-row"
                  key={stage.name}
                >
                  <span>{stage.name}</span>

                  <div>
                    <i
                      style={{
                        width:
                          stage.count > 0
                            ? `${stage.progress}%`
                            : "0%",
                      }}
                    />
                  </div>

                  <b>{stage.count}</b>
                </div>
              )
            )}
          </section>

          <section className="panel agenda">
            <PanelHead
              icon="□"
              title="Agenda de hoje"
              action="Ver pedidos"
              onClick={() =>
                setScreen("Pedidos")
              }
            />

            {summary.todayAgenda.length ===
            0 ? (
              <div className="empty-notifications">
                <span>□</span>

                <p>
                  Nenhuma entrega agendada
                  para hoje.
                </p>
              </div>
            ) : (
              summary.todayAgenda.map(
                (order, index) => (
                  <div
                    className="agenda-item"
                    key={order.databaseId}
                  >
                    <b>{order.time}</b>

                    <i
                      className={
                        index % 2 === 0
                          ? "gold-dot"
                          : "pink-dot"
                      }
                    />

                    <span>
                      <strong>
                        {order.client}
                      </strong>

                      <small>
                        {order.item}
                      </small>
                    </span>
                  </div>
                )
              )
            )}

            <div className="sales-strip">
              <span>
                ⌁ &nbsp; Vendas do dia
              </span>

              <strong>
                {dashboardLoading
                  ? "..."
                  : money(
                      summary.revenueToday
                    )}
              </strong>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function OrderTable({
  orders,
}: {
  orders: AppOrder[];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Cliente</th><th>Pedido</th><th>Horário</th><th>Status</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td><span className="initials">{o.initials}</span><strong>{o.client}</strong></td>
              <td>{o.item}</td>
              <td>{o.time}</td>
              <td><Status>{o.status}</Status></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}