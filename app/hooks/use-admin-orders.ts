"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { supabase } from "../lib/supabase";
import {
  formatDeliveryDate,
  normalizeSearch,
  orderStatusCode,
} from "../lib/formatters";
import { mapAdminOrder } from "../lib/mappers";

import type {
  AdminOrderRow,
  AppOrder,
  Role,
} from "../types";

type UseAdminOrdersOptions = {
  authLoading: boolean;
  role: Role | null;

  setToast: Dispatch<
    SetStateAction<string>
  >;
};

export function useAdminOrders({
  authLoading,
  role,
  setToast,
}: UseAdminOrdersOptions) {
  const [appOrders, setAppOrders] =
    useState<AppOrder[]>([]);

  const [query, setQuery] =
    useState("");

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] = useState<string | null>(null);

  const [
    resolvingRequestId,
    setResolvingRequestId,
  ] = useState<string | null>(null);

  const showToast = useCallback(
    (
      message: string,
      duration = 2800
    ) => {
      setToast(message);

      window.setTimeout(() => {
        setToast("");
      }, duration);
    },
    [setToast]
  );

  useEffect(() => {
    if (
      authLoading ||
      role !== "admin"
    ) {
      return;
    }

    let componentActive = true;

    async function loadAdminOrders() {
      const {
        data,
        error: ordersError,
      } = await supabase
        .from("orders")
        .select(`
          id,
          user_id,
          order_number,
          customer_name,
          customer_phone,
          status,
          payment_status,
          total_amount,
          subtotal_amount,
          delivery_fee,
          fulfillment_type,
          delivery_address,
          delivery_date,
          delivery_time,
          request_type,
          request_status,
          requested_delivery_date,
          requested_delivery_time,
          request_reason,
          created_at,
          order_items (
            product_name,
            quantity
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!componentActive) {
        return;
      }

      if (ordersError) {
        console.error(
          "Erro ao carregar pedidos do administrador:",
          ordersError
        );

        showToast(
          "Não foi possível carregar os pedidos."
        );

        return;
      }

      const orderRows =
        (data || []) as AdminOrderRow[];

      setAppOrders(
        orderRows.map(mapAdminOrder)
      );
    }

    void loadAdminOrders();

    return () => {
      componentActive = false;
    };
  }, [
    authLoading,
    role,
    showToast,
  ]);

  async function handleOrderStatusChange(
    databaseId: string,
    newStatusLabel: string
  ) {
    const newStatusCode =
      orderStatusCode(newStatusLabel);

    setUpdatingOrderId(databaseId);

    try {
      const {
        error: statusError,
      } = await supabase
        .from("orders")
        .update({
          status: newStatusCode,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", databaseId);

      if (statusError) {
        console.error(
          "Erro ao atualizar status:",
          statusError
        );

        showToast(
          "Não foi possível atualizar o status."
        );

        return;
      }

      setAppOrders(currentOrders =>
        currentOrders.map(order =>
          order.databaseId === databaseId
            ? {
                ...order,
                status: newStatusLabel,
                statusCode: newStatusCode,
              }
            : order
        )
      );

      showToast(
        "Status do pedido atualizado!",
        2000
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao atualizar status:",
        error
      );

      showToast(
        "Ocorreu um erro ao atualizar o status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function resolveOrderRequest(
    order: AppOrder,
    decision:
      | "approved"
      | "rejected"
  ) {
    setResolvingRequestId(
      order.databaseId
    );

    try {
      const isPaidCancellationApproval =
        decision === "approved" &&
        order.requestType ===
          "cancellation" &&
        [
          "paid",
          "refund_pending",
          "refunded",
        ].includes(order.paymentStatus);

      if (isPaidCancellationApproval) {
        const {
          data: refundData,
          error: refundError,
        } =
          await supabase.functions.invoke(
            "refund-stripe-payment",
            {
              body: {
                orderId:
                  order.databaseId,
              },
            }
          );

        if (refundError) {
          let errorMessage =
            "Não foi possível solicitar o reembolso.";

          try {
            const errorContext = (
              refundError as {
                context?: Response;
              }
            ).context;

            if (errorContext) {
              const errorBody =
                await errorContext
                  .clone()
                  .json();

              console.error(
                "Resposta da função de reembolso:",
                errorBody
              );

              if (errorBody?.error) {
                errorMessage =
                  errorBody.error;
              }
            }
          } catch (contextError) {
            console.error(
              "Não foi possível ler a resposta da função:",
              contextError
            );
          }

          console.error(
            "Erro ao solicitar reembolso:",
            refundError
          );

          showToast(errorMessage);
          return;
        }

        if (!refundData?.success) {
          showToast(
            refundData?.error ||
              "Não foi possível solicitar o reembolso."
          );

          return;
        }
      } else {
        const {
          error: resolveError,
        } = await supabase.rpc(
          "resolve_order_request",
          {
            p_order_id:
              order.databaseId,

            p_decision: decision,
          }
        );

        if (resolveError) {
          console.error(
            "Erro ao responder solicitação:",
            resolveError
          );

          showToast(
            "Não foi possível responder à solicitação."
          );

          return;
        }
      }

      setAppOrders(currentOrders =>
        currentOrders.map(
          currentOrder => {
            if (
              currentOrder.databaseId !==
              order.databaseId
            ) {
              return currentOrder;
            }

            if (
              decision === "rejected"
            ) {
              return {
                ...currentOrder,
                request: undefined,
                requestStatus:
                  "rejected",
              };
            }

            if (
              currentOrder.requestType ===
              "cancellation"
            ) {
              return {
                ...currentOrder,

                status: "Cancelado",
                statusCode: "cancelled",

                paymentStatus:
                  isPaidCancellationApproval
                    ? "refund_pending"
                    : currentOrder.paymentStatus,

                request: undefined,
                requestStatus:
                  "approved",
              };
            }

            return {
              ...currentOrder,

              date:
                currentOrder.requestedDate
                  ? formatDeliveryDate(
                      currentOrder.requestedDate
                    )
                  : currentOrder.date,

              time:
                currentOrder.requestedTime
                  ?.slice(0, 5) ||
                currentOrder.time,

              request: undefined,
              requestStatus:
                "approved",
            };
          }
        )
      );

      if (
        isPaidCancellationApproval
      ) {
        showToast(
          "Cancelamento aprovado e reembolso solicitado!"
        );
      } else {
        showToast(
          decision === "approved"
            ? "Solicitação aprovada!"
            : "Solicitação rejeitada!"
        );
      }
    } catch (error) {
      console.error(
        "Erro inesperado ao responder solicitação:",
        error
      );

      showToast(
        "Ocorreu um erro ao responder à solicitação."
      );
    } finally {
      setResolvingRequestId(null);
    }
  }

  const filteredOrders =
    useMemo(() => {
      const normalizedQuery =
        normalizeSearch(query);

      if (!normalizedQuery) {
        return appOrders;
      }

      return appOrders.filter(
        order => {
          const fulfillmentLabel =
            order.fulfillmentType ===
            "delivery"
              ? "Entrega"
              : order.fulfillmentType ===
                  "pickup"
                ? "Retirada"
                : "";

          const searchableContent = [
            order.id,
            order.client,
            order.item,
            order.status,
            order.statusCode,
            order.paymentStatus,
            order.date,
            order.time,
            order.deliveryDateRaw ||
              "",
            fulfillmentLabel,
            order.deliveryAddress ||
              "",
            order.request || "",
          ].join(" ");

          return normalizeSearch(
            searchableContent
          ).includes(
            normalizedQuery
          );
        }
      );
    }, [query, appOrders]);

  return {
    appOrders,
    setAppOrders,

    query,
    setQuery,
    filteredOrders,

    updatingOrderId,
    resolvingRequestId,

    handleOrderStatusChange,
    resolveOrderRequest,
  };
}