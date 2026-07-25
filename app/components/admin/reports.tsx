"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import type {
  AppOrder,
  AppReview,
  ProductSalesRow,
} from "../../types";

import {
  getInitials,
  money,
  priceNumber,
} from "../../lib/formatters";

import {
  Kpi,
  PanelHead,
} from "../ui";

export function Reports({
  reviews,
  orders,
  loading,
}: {
  reviews: AppReview[];
  orders: AppOrder[];
  loading: boolean;
}) {

  const [salesItems, setSalesItems] =
    useState<ProductSalesRow[]>([]);

  const [salesLoading, setSalesLoading] =
    useState(true);

  const [salesError, setSalesError] =
    useState("");

  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (total, review) =>
            total + review.rating,
          0
        ) / reviews.length
      : 0;

  const validOrderIds = useMemo(
    () =>
      orders
        .filter(
          order =>
            order.statusCode !== "cancelled"
        )
        .map(order => order.databaseId),
    [orders]
  );

  useEffect(() => {
    let componentActive = true;

    async function loadProductSales() {
      setSalesLoading(true);
      setSalesError("");

      if (validOrderIds.length === 0) {
        setSalesItems([]);
        setSalesLoading(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("order_items")
        .select(`
          order_id,
          product_name,
          quantity,
          unit_price
        `)
        .in("order_id", validOrderIds);

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar produtos vendidos:",
          error
        );

        setSalesError(
          "Não foi possível carregar o ranking de produtos."
        );

        setSalesLoading(false);
        return;
      }

      setSalesItems(
        (data || []) as ProductSalesRow[]
      );

      setSalesLoading(false);
    }

    loadProductSales();

    return () => {
      componentActive = false;
    };
  }, [validOrderIds]);

  const productRanking = useMemo(() => {
  const productMap = new Map<
      string,
      {
        name: string;
        quantity: number;
        revenue: number;
      }
    >();

    salesItems.forEach(item => {
      const productName =
        item.product_name.trim();

      const currentProduct =
        productMap.get(productName) || {
          name: productName,
          quantity: 0,
          revenue: 0,
        };

      currentProduct.quantity +=
        Number(item.quantity);

      currentProduct.revenue +=
        Number(item.unit_price) *
        Number(item.quantity);

      productMap.set(
        productName,
        currentProduct
      );
    });

    const products = Array.from(
      productMap.values()
    )
      .sort(
        (firstProduct, secondProduct) =>
          secondProduct.quantity -
          firstProduct.quantity
      )
      .slice(0, 5);

    const maximumQuantity = Math.max(
      ...products.map(
        product => product.quantity
      ),
      1
    );

    return products.map(
      (product, index) => ({
        ...product,
        position: index + 1,
        percentage:
          (product.quantity /
            maximumQuantity) *
          100,
      })
    );
  }, [salesItems]);

  const reportSummary = useMemo(() => {
    const validOrders = orders.filter(
      order =>
        order.statusCode !== "cancelled"
    );

    const completedOrders = orders.filter(
      order =>
        order.statusCode === "completed"
    );

    const cancelledOrders = orders.filter(
      order =>
        order.statusCode === "cancelled"
    );

    const totalOrderValue =
      validOrders.reduce(
        (total, order) =>
          total + priceNumber(order.value),
        0
      );

    const averageTicket =
      validOrders.length > 0
        ? totalOrderValue /
          validOrders.length
        : 0;

    const uniqueClients = new Set(
      validOrders.map(order =>
        order.client
          .trim()
          .toLowerCase()
      )
    ).size;

    const completionRate =
      orders.length > 0
        ? Math.round(
            (completedOrders.length /
              orders.length) *
              100
          )
        : 0;

    const cancellationRate =
      orders.length > 0
        ? Math.round(
            (cancelledOrders.length /
              orders.length) *
              100
          )
        : 0;

    return {
      totalOrderValue,
      averageTicket,
      uniqueClients,
      completedOrders:
        completedOrders.length,
      cancelledOrders:
        cancelledOrders.length,
      completionRate,
      cancellationRate,
    };
  }, [orders]);

  function reviewDate(createdAt: string) {
    return new Date(
      createdAt
    ).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div className="content">
      <div className="kpis review-kpis">
        <Kpi
          icon="★"
          label="Nota média"
          value={
            reviews.length > 0
              ? averageRating.toFixed(1)
              : "—"
          }
          note="De 5 estrelas"
          tone="gold"
        />

        <Kpi
          icon="◇"
          label="Avaliações"
          value={String(reviews.length)}
          note="Pedidos avaliados"
          tone="green"
        />

        <Kpi
          icon="✓"
          label="Satisfação"
          value={
            reviews.length > 0
              ? `${Math.round(
                  (reviews.filter(
                    review =>
                      review.rating >= 4
                  ).length /
                    reviews.length) *
                    100
                )}%`
              : "—"
          }
          note="Notas entre 4 e 5"
          tone="green"
        />
      </div>

      <section className="panel reviews-panel">
        <div className="panel-head">
          <span>★</span>

          <div>
            <p className="eyebrow">
              EXPERIÊNCIA DOS CLIENTES
            </p>

            <h2>Avaliações recebidas</h2>
          </div>
        </div>

        {loading ? (
          <div className="empty-notifications">
            <span>◌</span>
            <p>Carregando avaliações...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-notifications">
            <span>☆</span>
            <p>Nenhuma avaliação recebida.</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => {
              const relatedOrder =
                orders.find(
                  order =>
                    order.databaseId ===
                    review.orderId
                );

              return (
                <article key={review.id}>
                  <div className="review-avatar">
                    {getInitials(
                      relatedOrder?.client ||
                        "Cliente"
                    )}
                  </div>

                  <div className="review-content">
                    <header>
                      <div>
                        <strong>
                          {relatedOrder?.client ||
                            "Cliente"}
                        </strong>

                        <small>
                          {relatedOrder?.id ||
                            "Pedido"}
                          {relatedOrder?.item
                            ? ` • ${relatedOrder.item}`
                            : ""}
                        </small>
                      </div>

                      <time>
                        {reviewDate(
                          review.createdAt
                        )}
                      </time>
                    </header>

                    <div
                      className="review-rating"
                      aria-label={`${review.rating} de 5 estrelas`}
                    >
                      {[1, 2, 3, 4, 5].map(
                        star => (
                          <span
                            key={star}
                            className={
                              star <=
                              review.rating
                                ? "selected"
                                : ""
                            }
                          >
                            ★
                          </span>
                        )
                      )}
                    </div>

                    <p>{review.comment}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel product-ranking-panel">
        <PanelHead
          icon="♨"
          title="Produtos mais vendidos"
          subtitle="Ranking dos pedidos não cancelados"
        />

        {salesLoading ? (
          <div className="empty-notifications">
            <span>◌</span>
            <p>Carregando vendas...</p>
          </div>
        ) : salesError ? (
          <p className="form-error">
            {salesError}
          </p>
        ) : productRanking.length === 0 ? (
          <div className="empty-notifications">
            <span>▤</span>
            <p>
              Nenhum produto vendido encontrado.
            </p>
          </div>
        ) : (
          <div className="product-ranking-list">
            {productRanking.map(product => (
              <article key={product.name}>
                <strong className="ranking-position">
                  {product.position}
                </strong>

                <div className="ranking-product">
                  <header>
                    <div>
                      <h3>{product.name}</h3>

                      <small>
                        {product.quantity} unidade(s)
                        vendida(s)
                      </small>
                    </div>

                    <b>
                      {money(product.revenue)}
                    </b>
                  </header>

                  <div className="ranking-bar">
                    <i
                      style={{
                        width:
                          `${product.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="report-grid">
        <article className="panel report">
          <span>▥</span>

          <h3>Valor dos pedidos</h3>

          <strong className="report-value">
            {money(
              reportSummary.totalOrderValue
            )}
          </strong>

          <p>
            Ticket médio de{" "}
            {money(
              reportSummary.averageTicket
            )}{" "}
            por pedido não cancelado.
          </p>
        </article>

        <article className="panel report">
          <span>✓</span>

          <h3>Pedidos concluídos</h3>

          <strong className="report-value">
            {reportSummary.completedOrders}
          </strong>

          <p>
            {reportSummary.completionRate}% dos
            pedidos cadastrados foram concluídos.
          </p>
        </article>

        <article className="panel report">
          <span>♙</span>

          <h3>Clientes atendidos</h3>

          <strong className="report-value">
            {reportSummary.uniqueClients}
          </strong>

          <p>
            Clientes diferentes com pedidos não
            cancelados.
          </p>
        </article>

        <article className="panel report">
          <span>×</span>

          <h3>Cancelamentos</h3>

          <strong className="report-value">
            {reportSummary.cancelledOrders}
          </strong>

          <p>
            {reportSummary.cancellationRate}% dos
            pedidos cadastrados foram cancelados.
          </p>
        </article>
      </div>
    </div>
  );
}