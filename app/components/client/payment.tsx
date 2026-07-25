"use client";

import { useState } from "react";

import { supabase } from "../../lib/supabase";

import {
  money,
  priceNumber,
} from "../../lib/formatters";

import type {
  CartItem,
  CheckoutOrderOptions,
  OrderCreationResult,
} from "../../types";

import { Status } from "../ui";


export function Payment({
  paid,
  cart,
  onPay,
  onViewOrders,
  returning,
  returnError,
  confirmedOrderNumber,
  minimumOrderValue,
  deliveryFee,
  acceptsOrders,
  storeAddress,
  storeCity,
  storeState,
  storeZipCode,
  openingTime,
  closingTime,
  businessDays,
  businessWeekdays,
}: {
  paid: boolean;
  cart: CartItem[];

  onPay: (
    options: CheckoutOrderOptions
  ) => Promise<OrderCreationResult>;

  onViewOrders: () => void;

  returning: boolean;
  returnError: string;
  confirmedOrderNumber: number | null;

  minimumOrderValue: number;
  deliveryFee: number;
  acceptsOrders: boolean;
  storeAddress: string;
  storeCity: string;
  storeState: string;
  storeZipCode: string;
  openingTime: string;
  closingTime: string;
  businessDays: string;
  businessWeekdays: number[];
}) {


  const [
    fulfillmentType,
    setFulfillmentType,
  ] = useState<
    "delivery" | "pickup"
  >("pickup");

  const [
    deliveryAddress,
    setDeliveryAddress,
  ] = useState("");

  const [
    deliveryDate,
    setDeliveryDate,
  ] = useState("");

  const [
    deliveryTime,
    setDeliveryTime,
  ] = useState("");

  const [
    pendingOrder,
    setPendingOrder,
  ] = useState<{
    id: string;
    number: number;
  } | null>(() => {
    const savedOrderId =
      sessionStorage.getItem(
        "stripe-checkout-order-id"
      );

    const savedOrderNumber =
      sessionStorage.getItem(
        "stripe-checkout-order-number"
      );

    if (
      !savedOrderId ||
      !savedOrderNumber
    ) {
      return null;
    }

    return {
      id: savedOrderId,
      number: Number(savedOrderNumber),
    };
  });

  const [processing, setProcessing] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      priceNumber(item.product.price) *
        item.quantity,
    0
  );

  const appliedDeliveryFee =
    fulfillmentType === "delivery"
      ? deliveryFee
      : 0;

  const checkoutTotal =
    subtotal + appliedDeliveryFee;

  const pickupAddress = [
    storeAddress,
    [storeCity, storeState]
      .filter(Boolean)
      .join(" - "),
    storeZipCode
      ? `CEP ${storeZipCode}`
      : "",
  ]
    .filter(Boolean)
    .join(" • ");

  const formattedOpeningTime =
    openingTime
      ? openingTime.slice(0, 5)
      : "";

  const formattedClosingTime =
    closingTime
      ? closingTime.slice(0, 5)
      : "";

  const storeHours =
    formattedOpeningTime &&
    formattedClosingTime
      ? `${formattedOpeningTime} às ${formattedClosingTime}`
      : "Horário a confirmar";

  const today = new Date();

  const minimumDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(
      2,
      "0"
    ),
    String(today.getDate()).padStart(
      2,
      "0"
    ),
  ].join("-");

async function confirmOrder() {
  setPaymentError("");

  if (!acceptsOrders) {
    setPaymentError(
      "A confeitaria não está aceitando novos pedidos no momento."
    );

    return;
  }

  if (
    minimumOrderValue > 0 &&
    subtotal < minimumOrderValue
  ) {
    setPaymentError(
      `O pedido mínimo é de ${money(
        minimumOrderValue
      )}.`
    );

    return;
  }

  if (
    fulfillmentType === "delivery" &&
    deliveryAddress.trim().length < 5
  ) {
    setPaymentError(
      "Informe o endereço para entrega."
    );

    return;
  }

  if (!deliveryDate) {
    setPaymentError(
      "Selecione a data desejada."
    );

    return;
  }

  if (deliveryDate < minimumDate) {
    setPaymentError(
      "A data do pedido não pode estar no passado."
    );

    return;
  }

  const selectedDate = new Date(
    `${deliveryDate}T12:00:00`
  );

  const selectedWeekday =
    selectedDate.getDay();

  if (
    businessWeekdays.length > 0 &&
    !businessWeekdays.includes(
      selectedWeekday
    )
  ) {
    setPaymentError(
      "A confeitaria não funciona na data selecionada."
    );

    return;
  }

  if (!deliveryTime) {
    setPaymentError(
      "Selecione o horário preferido."
    );

    return;
  }

  const selectedTime =
    deliveryTime.slice(0, 5);

  if (
    formattedOpeningTime &&
    selectedTime < formattedOpeningTime
  ) {
    setPaymentError(
      `Selecione um horário a partir das ${formattedOpeningTime}.`
    );

    return;
  }

  if (
    formattedClosingTime &&
    selectedTime > formattedClosingTime
  ) {
    setPaymentError(
      `Selecione um horário até as ${formattedClosingTime}.`
    );

    return;
  }

  setProcessing(true);

  try {
    let order = pendingOrder;

    if (!order) {
      const result = await onPay({
        fulfillmentType,
        deliveryAddress:
          deliveryAddress.trim(),
        deliveryDate,
        deliveryTime,
      });

      if (!result.success) {
        setPaymentError(result.message);
        return;
      }

      order = {
        id: result.orderId,
        number: result.orderNumber,
      };

      setPendingOrder(order);

    }

    const {
      data,
      error: checkoutError,
    } = await supabase.functions.invoke(
      "create-stripe-checkout",
      {
        body: {
          orderId: order.id,
        },
      }
    );

    if (checkoutError) {
      let errorMessage =
        "Não foi possível abrir o pagamento seguro.";

      try {
        const errorContext =
          (
            checkoutError as {
              context?: Response;
            }
          ).context;

        if (errorContext) {
          const errorBody =
            await errorContext.clone().json();

          console.error(
            "Resposta da Edge Function:",
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
        "Erro ao iniciar Checkout:",
        checkoutError
      );

      setPaymentError(errorMessage);
      return;
    }

    const checkoutUrl =
      data?.url as string | undefined;

    if (!checkoutUrl) {
      console.error(
        "URL do Checkout não recebida:",
        data
      );

      setPaymentError(
        data?.error ||
          "A Stripe não retornou a página de pagamento."
      );

      return;
    }
    sessionStorage.setItem(
      "stripe-checkout-cart",
      JSON.stringify(cart)
    );

    sessionStorage.setItem(
      "stripe-checkout-order-number",
      String(order.number)
    );

    sessionStorage.setItem(
      "stripe-checkout-order-id",
      order.id
    );

    window.location.assign(checkoutUrl);
  } catch (error) {
    console.error(
      "Erro inesperado no pagamento:",
      error
    );

    setPaymentError(
      "Ocorreu um erro ao iniciar o pagamento."
    );
  } finally {
    setProcessing(false);
  }
}
  if (returning) {
    return (
      <div className="success-state">
        <span>⌛</span>

        <h1>Confirmando pagamento...</h1>

        <p>
          Recebemos o retorno da Stripe e estamos
          confirmando o pagamento do seu pedido.
        </p>
      </div>
    );
  }

  const checkoutItems = cart;
  if (!paid && checkoutItems.length === 0) {
    return (
      <div className="empty-cart">
        <span>🧁</span>

        <h3>Nenhum produto selecionado</h3>

        <p>
          Adicione produtos ao carrinho antes de realizar
          o pagamento.
        </p>
      </div>
    );
  }

  if (paid) {
    return (
      <div className="success-state">
        <span>✓</span>

        <h1>Pagamento confirmado!</h1>

        {confirmedOrderNumber && (
          <strong>
            Pedido #{confirmedOrderNumber}
          </strong>
        )}

        <p>
          {checkoutItems.length > 0 ? (
            <>
              Seu pedido com{" "}
              {checkoutItems.reduce(
                (sum, item) =>
                  sum + item.quantity,
                0
              )}{" "}
              {checkoutItems.reduce(
                (sum, item) =>
                  sum + item.quantity,
                0
              ) === 1
                ? "item"
                : "itens"}{" "}
              foi recebido. A confeitaria já pode
              acompanhar a encomenda.
            </>
          ) : (
            <>
              Seu pagamento foi confirmado e o pedido
              já está disponível para a confeitaria.
            </>
          )}
        </p>

        <Status>Confirmado</Status>

        <div className="payment-success-actions">
          <button
            type="button"
            className="primary"
            onClick={onViewOrders}
          >
            Ver meus pedidos
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="client-page-title"><p className="eyebrow">PAGAMENTO</p><h1>Finalize sua encomenda</h1><span>Revise todos os itens e escolha a forma de pagamento.</span></div>
      <div className="payment-layout">
        <section className="panel payment-card">
          <h2>Forma de recebimento</h2>

          <div className="fulfillment-options">
            <button
              type="button"
              className={
                fulfillmentType === "pickup"
                  ? "selected"
                  : ""
              }
              onClick={() => {
                setFulfillmentType("pickup");
                setPaymentError("");
              }}
            >
              <span>⌂</span>

              <div>
                <strong>Retirada no local</strong>
                <small>Sem taxa de entrega</small>
              </div>
            </button>

            <button
              type="button"
              className={
                fulfillmentType === "delivery"
                  ? "selected"
                  : ""
              }
              onClick={() => {
                setFulfillmentType("delivery");
                setPaymentError("");
              }}
            >
              <span>▣</span>

              <div>
                <strong>Receber em casa</strong>

                <small>
                  Taxa de {money(deliveryFee)}
                </small>
              </div>
            </button>
          </div>

          {fulfillmentType === "pickup" && (
            <div className="pickup-information">
              <span>⌂</span>

              <div>
                <strong>Retirada na confeitaria</strong>

                <p>
                  {pickupAddress ||
                    "Endereço de retirada a confirmar"}
                </p>

                <small>
                  {businessDays ||
                    "Dias de funcionamento a confirmar"}
                  {" • "}
                  {storeHours}
                </small>
              </div>
            </div>
          )}

          <div className="delivery-fields">
            {fulfillmentType === "delivery" && (
              <label className="wide">
                Endereço para entrega

                <input
                  required
                  value={deliveryAddress}
                  onChange={event =>
                    setDeliveryAddress(
                      event.target.value
                    )
                  }
                  placeholder="Rua, número, bairro e complemento"
                />
              </label>
            )}

            <label>
              Data desejada

              <input
                required
                type="date"
                min={minimumDate}
                value={deliveryDate}
                onChange={event => {
                  setDeliveryDate(
                    event.target.value
                  );

                  setPaymentError("");
                }}
              />
            </label>

            <label>
              Horário preferido

              <input
                required
                type="time"
                min={
                  formattedOpeningTime ||
                  undefined
                }
                max={
                  formattedClosingTime ||
                  undefined
                }
                value={deliveryTime}
                onChange={event => {
                  setDeliveryTime(
                    event.target.value
                  );

                  setPaymentError("");
                }}
              />
            </label>
          </div>

          {minimumOrderValue > 0 && (
            <div
              className={`minimum-order-notice ${
                subtotal >= minimumOrderValue
                  ? "reached"
                  : ""
              }`}
            >
              <span>
                {subtotal >= minimumOrderValue
                  ? "✓"
                  : "!"}
              </span>

              <p>
                {subtotal >= minimumOrderValue
                  ? "O valor mínimo do pedido foi atingido."
                  : `O pedido mínimo é de ${money(
                      minimumOrderValue
                    )}. Faltam ${money(
                      minimumOrderValue -
                        subtotal
                    )}.`}
              </p>
            </div>
          )}

          <h2 className="payment-method-title">
            Forma de pagamento
          </h2>

          <div className="stripe-checkout-note">
            <span>⌑</span>

            <div>
              <b>Pagamento seguro pela Stripe</b>

              <p>
                Na próxima página você poderá escolher
                as formas de pagamento disponíveis.
                Os dados financeiros serão informados
                diretamente no ambiente da Stripe.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="confirm-payment"
            disabled={processing}
            onClick={confirmOrder}
          >
            {processing
              ? "Abrindo pagamento seguro..."
              : `Pagar ${money(
                checkoutTotal
              )} com Stripe`}
          </button>
          {(paymentError || returnError) && (
            <p className="form-error">
              {paymentError || returnError}
            </p>
          )}
          <small className="secure-note">
            ⌑ Pagamento processado pela Stripe
          </small>
        </section>
        <aside className="panel order-summary">
          <h2>Resumo do pedido</h2>
          {checkoutItems.map(item => <div key={item.product.id}><span>{item.quantity}× {item.product.name}</span><b>{money(priceNumber(item.product.price) * item.quantity)}</b></div>)}
          <div>
            <span>Subtotal</span>
            <b>{money(subtotal)}</b>
          </div>

          <div>
            <span>
              {fulfillmentType === "delivery"
                ? "Taxa de entrega"
                : "Retirada no local"}
            </span>

            <b>
              {fulfillmentType === "delivery"
                ? money(appliedDeliveryFee)
                : "Grátis"}
            </b>
          </div>

          <hr />

          <div className="total">
            <span>Total</span>
            <b>{money(checkoutTotal)}</b>
          </div>
          <small>Prazo confirmado após o pedido.</small>
        </aside>
      </div>
    </>
  );
}