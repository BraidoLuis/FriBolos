"use client";

import {
  useCallback,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

import { supabase } from "../lib/supabase";

import {
  formatDeliveryDate,
  getInitials,
  money,
  orderStatusLabel,
} from "../lib/formatters";

import type {
  AppOrder,
  ClientProfileRow,
  Product,
} from "../types";

type FulfillmentType =
  | "delivery"
  | "pickup";

type UseAdminOrderFormOptions = {
  products: Product[];

  setProducts: Dispatch<
    SetStateAction<Product[]>
  >;

  deliveryFeeMode:
  | "fixed"
  | "distance"
  | null;

  orderClients: ClientProfileRow[];

  setAppOrders: Dispatch<
    SetStateAction<AppOrder[]>
  >;

  setToast: Dispatch<
    SetStateAction<string>
  >;

  onClose: () => void;
};

export function useAdminOrderForm({
  products,
  setProducts,
  orderClients,
  setAppOrders,
  setToast,
  onClose,
  deliveryFeeMode,
}: UseAdminOrderFormOptions) {
  const [
    savingOrder,
    setSavingOrder,
  ] = useState(false);

  const [
    adminFulfillmentType,
    setAdminFulfillmentType,
  ] = useState<FulfillmentType>(
    "pickup"
  );

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

  async function saveOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData =
      new FormData(form);

    const clientId = String(
      formData.get("clientId") || ""
    );

    const productId = String(
      formData.get("productId") || ""
    );

    const quantity = Number(
      formData.get("quantity") || 0
    );

    const deliveryDate = String(
      formData.get("deliveryDate") || ""
    );

    const deliveryTime = String(
      formData.get("deliveryTime") || ""
    );

    const statusCode = String(
      formData.get("status") ||
        "confirmed"
    );

    const fulfillmentType = String(
      formData.get(
        "fulfillmentType"
      ) || "pickup"
    ) as FulfillmentType;

    const deliveryAddress = String(
      formData.get(
        "deliveryAddress"
      ) || ""
    ).trim().replace(/\s+/g, " ");

    const deliveryZipCode = String(
      formData.get("deliveryZipCode") || ""
    ).replace(/\D/g, "");

    const notes = String(
      formData.get("notes") || ""
    ).trim();

    const selectedClient =
      orderClients.find(
        client =>
          client.id === clientId
      );

    const selectedProduct =
      products.find(
        product =>
          String(product.id) ===
          productId
      );

    if (!selectedClient) {
      showToast(
        "Selecione um cliente."
      );

      return;
    }

    if (!selectedProduct) {
      showToast(
        "Selecione um produto."
      );

      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      showToast(
        "Informe uma quantidade válida."
      );

      return;
    }

    if (
      quantity >
      selectedProduct.stock
    ) {
      showToast(
        `Estoque disponível: ${selectedProduct.stock}.`
      );

      return;
    }

    if (
      fulfillmentType ===
        "delivery" &&
      deliveryAddress.length < 5
    ) {
      showToast(
        "Informe o endereço para entrega."
      );

      return;
    }

    if (!deliveryFeeMode) {
      showToast(
        "Aguarde as configurações da confeitaria carregarem."
      );
      return;
    }

    const needsDeliveryQuote =
      fulfillmentType === "delivery" &&
      deliveryFeeMode === "distance";

    if (
      needsDeliveryQuote &&
      (
        !/^\d{8}$/.test(deliveryZipCode) ||
        deliveryAddress.length < 15 ||
        deliveryAddress.length > 250 ||
        !(
          /\d/.test(deliveryAddress) ||
          /\bS\s*\/?\s*N\b/i.test(
            deliveryAddress
          )
        )
      )
    ) {
      showToast(
        "Informe CEP, rua, número ou S/N e bairro para calcular a entrega.",
        3500
      );
      return;
    }

    setSavingOrder(true);

    try {
      let deliveryQuoteId: string | null =
        null;

      if (needsDeliveryQuote) {
        const {
          data: quote,
          error: quoteError,
        } = await supabase.functions.invoke(
          "quote-delivery",
          {
            body: {
              deliveryAddress,
              deliveryZipCode,
            },
          }
        );

        if (quoteError) {
          console.error(
            "Erro ao cotar entrega:",
            quoteError
          );

          let message =
            "Não foi possível calcular a taxa de entrega.";

          try {
            const context = (
              quoteError as {
                context?: Response;
              }
            ).context;

            if (context) {
              const responseBody =
                (await context.clone().json()) as {
                  error?: string;
                };

              if (
                typeof responseBody.error ===
                "string"
              ) {
                message = responseBody.error;
              }
            }
          } catch (contextError) {
            console.error(
              "Erro ao ler resposta da cotação:",
              contextError
            );
          }

          showToast(message, 4000);
          return;
        }

        const feeCents =
          quote?.deliveryFeeCents;

        if (
          typeof quote?.quoteId !== "string" ||
          !quote.quoteId ||
          typeof feeCents !== "number" ||
          !Number.isSafeInteger(feeCents) ||
          feeCents < 0
        ) {
          showToast(
            "A cotação não retornou um valor válido.",
            3500
          );
          return;
        }

        const confirmed =
          window.confirm(
            `Taxa de entrega para o CEP ${deliveryZipCode}: ${money(
              feeCents / 100
            )}.\n\nCriar o pedido com essa taxa?`
          );

        if (!confirmed) {
          return;
        }

        deliveryQuoteId =
          quote.quoteId;
      }
      const {
        data,
        error,
      } = await supabase.rpc(
        "create_admin_order_v2",
        {
          p_client_id: clientId,

          p_items: [
            {
              product_id:
                productId,

              quantity,

              customization: {},
            },
          ],

          p_status: statusCode,

          p_delivery_date:
            deliveryDate || null,

          p_delivery_time:
            deliveryTime || null,

          p_notes:
            notes || null,

          p_fulfillment_type:
            fulfillmentType,

          p_delivery_address:
            fulfillmentType ===
            "delivery"
              ? deliveryAddress
              : null,
          p_delivery_zip_code:
            needsDeliveryQuote
              ? deliveryZipCode
              : null,

          p_delivery_quote_id:
            deliveryQuoteId,
        }
      );

      if (error) {
        console.error(
          "Erro ao criar pedido administrativo:",
          error
        );

        showToast(
          error.message ||
            "Não foi possível criar o pedido.",
          3200
        );

        return;
      }

      const result = data as {
        order_id: string;

        order_number:
          | number
          | string;

        subtotal_amount:
          | number
          | string;

        delivery_fee:
          | number
          | string;

        total_amount:
          | number
          | string;

        fulfillment_type:
          FulfillmentType;

        delivery_address:
          | string
          | null;

        status: string;
      };

      const newOrder: AppOrder = {
        databaseId:
          result.order_id,

        userId:
          selectedClient.id,

        id:
          `#${result.order_number}`,

        client:
          selectedClient.full_name,

        initials: getInitials(
          selectedClient.full_name
        ),

        item:
          `${quantity}× ${selectedProduct.name}`,

        time:
          deliveryTime
            ? deliveryTime.slice(
                0,
                5
              )
            : "A combinar",

        date:
          deliveryDate
            ? formatDeliveryDate(
                deliveryDate
              )
            : "Data a combinar",

        value: money(
          Number(
            result.total_amount
          )
        ),

        subtotalAmount: Number(
          result.subtotal_amount
        ),

        deliveryFeeAmount: Number(
          result.delivery_fee
        ),

        fulfillmentType:
          result.fulfillment_type,

        deliveryAddress:
          result.delivery_address,

        status: orderStatusLabel(
          result.status
        ),

        statusCode:
          result.status,

        paymentStatus:
          "pending",

        createdAt:
          new Date().toISOString(),

        deliveryDateRaw:
          deliveryDate || null,

        request: undefined,
        requestType: null,
        requestStatus: null,
        requestedDate: null,
        requestedTime: null,
      };

      setAppOrders(
        currentOrders => [
          newOrder,
          ...currentOrders,
        ]
      );

      setProducts(
        currentProducts =>
          currentProducts.map(
            product =>
              String(product.id) ===
              productId
                ? {
                    ...product,

                    stock:
                      product.stock -
                      quantity,
                  }
                : product
          )
      );

      form.reset();

      setAdminFulfillmentType(
        "pickup"
      );

      onClose();

      showToast(
        `Pedido #${result.order_number} cadastrado com sucesso!`
      );
    } catch (unexpectedError) {
      console.error(
        "Erro inesperado ao criar pedido:",
        unexpectedError
      );

      showToast(
        "Ocorreu um erro ao criar o pedido."
      );
    } finally {
      setSavingOrder(false);
    }
  }

  return {
    savingOrder,
    adminFulfillmentType,
    setAdminFulfillmentType,
    saveOrder,
  };
}