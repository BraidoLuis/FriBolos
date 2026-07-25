"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import type {
  FinancePaymentRow,
} from "../../types";

import { money } from "../../lib/formatters";

import {
  Kpi,
  PanelHead,
} from "../ui";

export function Finance() {
  const [payments, setPayments] =
    useState<FinancePaymentRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [financeError, setFinanceError] =
    useState("");

  useEffect(() => {
    let componentActive = true;

    async function loadFinance() {
      setLoading(true);
      setFinanceError("");

      const {
        data,
        error,
      } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          status,
          paid_at,
          refunded_at,
          created_at,
          orders (
            order_number
          )
        `)
        .order("created_at", {
          ascending: true,
        });

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar financeiro:",
          error
        );

        setFinanceError(
          "Não foi possível carregar os dados financeiros."
        );

        setLoading(false);
        return;
      }

      setPayments(
        (data || []) as unknown as FinancePaymentRow[]
      );

      setLoading(false);
    }

    loadFinance();

    return () => {
      componentActive = false;
    };
  }, []);

  const financeSummary = useMemo(() => {
    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyPayments =
      payments.filter(payment => {
        if (!payment.paid_at) {
          return false;
        }

        const paidDate =
          new Date(payment.paid_at);

        return (
          paidDate.getMonth() ===
            currentMonth &&
          paidDate.getFullYear() ===
            currentYear
        );
      });

    const grossRevenue =
      monthlyPayments.reduce(
        (total, payment) =>
          total + Number(payment.amount),
        0
      );

    const monthlyRefunds =
      payments.filter(payment => {
        if (
          payment.status !== "refunded" ||
          !payment.refunded_at
        ) {
          return false;
        }

        const refundedDate =
          new Date(payment.refunded_at);

        return (
          refundedDate.getMonth() ===
            currentMonth &&
          refundedDate.getFullYear() ===
            currentYear
        );
      });

    const refundedAmount =
      monthlyRefunds.reduce(
        (total, payment) =>
          total + Number(payment.amount),
        0
      );

    const netRevenue =
      grossRevenue - refundedAmount;

    const months = Array.from(
      {
        length: 7,
      },
      (_, index) => {
        const date = new Date(
          currentYear,
          currentMonth - 6 + index,
          1
        );

        return {
          year: date.getFullYear(),
          month: date.getMonth(),

          label: date.toLocaleDateString(
            "pt-BR",
            {
              month: "short",
            }
          )
            .replace(".", "")
            .replace(
              /^./,
              letter =>
                letter.toUpperCase()
            ),

          total: 0,
        };
      }
    );

    payments.forEach(payment => {
      if (!payment.paid_at) {
        return;
      }

      const paidDate =
        new Date(payment.paid_at);

      const month = months.find(
        item =>
          item.year ===
            paidDate.getFullYear() &&
          item.month ===
            paidDate.getMonth()
      );

      if (month) {
        month.total +=
          Number(payment.amount);
      }
    });

    payments.forEach(payment => {
      if (
        payment.status !== "refunded" ||
        !payment.refunded_at
      ) {
        return;
      }

      const refundedDate =
        new Date(payment.refunded_at);

      const month = months.find(
        item =>
          item.year ===
            refundedDate.getFullYear() &&
          item.month ===
            refundedDate.getMonth()
      );

      if (month) {
        month.total -=
          Number(payment.amount);
      }
    });

    const maximumValue = Math.max(
      ...months.map(month => month.total),
      1
    );

    const recentTransactions = [
      ...payments,
    ]
      .filter(payment =>
        [
          "paid",
          "refunded",
          "refund_pending",
        ].includes(payment.status)
      )
      .sort((firstPayment, secondPayment) => {
        const firstDate =
          firstPayment.refunded_at ||
          firstPayment.paid_at ||
          firstPayment.created_at;

        const secondDate =
          secondPayment.refunded_at ||
          secondPayment.paid_at ||
          secondPayment.created_at;

        return (
          new Date(secondDate).getTime() -
          new Date(firstDate).getTime()
        );
      })
      .slice(0, 10);
      
    return {
      grossRevenue,
      refundedAmount,
      netRevenue,
      confirmedPayments:
        monthlyPayments.length,
      refundedPayments:
        monthlyRefunds.length,
      recentTransactions,

      months: months.map(month => ({
        ...month,

      height:
        month.total > 0
          ? Math.max(
              4,
              (month.total / maximumValue) * 100
            )
          : 0,
      })),
    };
  }, [payments]);

  if (loading) {
    return (
      <div className="content">
        <section className="panel">
          <p>
            Carregando dados financeiros...
          </p>
        </section>
      </div>
    );
  }

  if (financeError) {
    return (
      <div className="content">
        <section className="panel">
          <p className="form-error">
            {financeError}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="kpis finance-kpis">
        <Kpi
          icon="$"
          label="Receita no mês"
          value={money(
            financeSummary.grossRevenue
          )}
          note={`${financeSummary.confirmedPayments} pagamento(s) confirmado(s)`}
          tone="green"
        />

        <Kpi
          icon="↘"
          label="Reembolsos no mês"
          value={money(
            financeSummary.refundedAmount
          )}
          note={`${financeSummary.refundedPayments} reembolso(s) realizado(s)`}
          tone="gold"
        />

        <Kpi
          icon="◇"
          label="Receita líquida"
          value={money(
            financeSummary.netRevenue
          )}
          note="Receita recebida menos reembolsos"
          tone="green"
        />
      </div>

      <section className="panel chart-panel">
        <PanelHead
          icon="▥"
          title="Fluxo financeiro"
          subtitle="Receita líquida dos últimos 7 meses"
        />

        <div className="chart">
          {financeSummary.months.map(
            month => (
              <div
                key={`${month.year}-${month.month}`}
                title={money(month.total)}
              >
                <i
                  style={{
                    height:
                      `${month.height}%`,
                  }}
                />

                <small>
                  {month.label}
                </small>
              </div>
            )
          )}
        </div>
      </section>

      <section className="panel finance-history">
        <PanelHead
          icon="$"
          title="Movimentações"
          subtitle="Pagamentos e reembolsos recentes"
        />

        {financeSummary.recentTransactions.length ===
        0 ? (
          <p className="finance-empty">
            Nenhuma movimentação financeira encontrada.
          </p>
        ) : (
          <div className="finance-table-wrapper">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Movimentação</th>
                  <th>Data</th>
                  <th>Situação</th>
                  <th>Valor</th>
                </tr>
              </thead>

              <tbody>
                {financeSummary.recentTransactions.map(
                  payment => {
                    const isRefunded =
                      payment.status === "refunded";

                    const isRefundPending =
                      payment.status ===
                      "refund_pending";

                    const transactionDate =
                      payment.refunded_at ||
                      payment.paid_at ||
                      payment.created_at;

                    return (
                      <tr key={payment.id}>
                        <td>
                          <strong>
                            {payment.orders?.order_number
                              ? `#${payment.orders.order_number}`
                              : "Pedido"}
                          </strong>
                        </td>

                        <td>
                          {isRefunded ||
                          isRefundPending
                            ? "Reembolso"
                            : "Pagamento"}
                        </td>

                        <td>
                          {new Date(
                            transactionDate
                          ).toLocaleString(
                            "pt-BR",
                            {
                              dateStyle: "short",
                              timeStyle: "short",
                            }
                          )}
                        </td>

                        <td>
                          <span
                            className={`finance-status ${
                              isRefunded
                                ? "refunded"
                                : isRefundPending
                                  ? "pending"
                                  : "paid"
                            }`}
                          >
                            {isRefunded
                              ? "Reembolsado"
                              : isRefundPending
                                ? "Reembolso pendente"
                                : "Pago"}
                          </span>
                        </td>

                        <td
                          className={
                            isRefunded ||
                            isRefundPending
                              ? "refund-value"
                              : "payment-value"
                          }
                        >
                          {isRefunded ||
                          isRefundPending
                            ? "− "
                            : "+ "}

                          {money(
                            Number(payment.amount)
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}