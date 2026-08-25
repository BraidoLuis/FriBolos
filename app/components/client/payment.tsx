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

const DELIVERY_ADDRESS_MIN_LENGTH = 15;
const DELIVERY_ADDRESS_MAX_LENGTH = 250;

function normalizeDeliveryAddress(
  address: string
) {
  return address
    .trim()
    .replace(/\s+/g, " ");
}

function deliveryAddressValidationError(
  address: string
): string | null {
  const normalizedAddress =
    normalizeDeliveryAddress(address);

  if (!normalizedAddress) {
    return "Informe o endereço para entrega.";
  }

  if (
    normalizedAddress.length <
    DELIVERY_ADDRESS_MIN_LENGTH
  ) {
    return "Informe um endereço mais completo, incluindo rua, número e bairro.";
  }

  if (
    normalizedAddress.length >
    DELIVERY_ADDRESS_MAX_LENGTH
  ) {
    return `O endereço deve possuir no máximo ${DELIVERY_ADDRESS_MAX_LENGTH} caracteres.`;
  }

  if (
    !/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(
      normalizedAddress
    )
  ) {
    return "Informe um endereço válido.";
  }

  const hasNumber =
    /\d/.test(normalizedAddress);

  const hasNoNumber =
    /\bS\s*\/?\s*N\b/i.test(
      normalizedAddress
    );

  if (!hasNumber && !hasNoNumber) {
    return "Informe o número do endereço ou utilize S/N.";
  }

  return null;
}

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
  
  const checkoutItems = cart;

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

  const minimumOrderProgress =
    minimumOrderValue > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              subtotal /
              minimumOrderValue
            ) * 100
          )
        )
      : 100;

  const totalItems =
    checkoutItems?.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    ) || 0;

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

    const normalizedDeliveryAddress =
      normalizeDeliveryAddress(
        deliveryAddress
      );

    if (fulfillmentType === "delivery") {
      const addressError =
        deliveryAddressValidationError(
          normalizedDeliveryAddress
        );

      if (addressError) {
        setPaymentError(addressError);
        return;
      }
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
      const savedPendingOrderId =
        sessionStorage.getItem(
          "stripe-checkout-order-id"
        );

      let order =
        pendingOrder &&
        savedPendingOrderId === pendingOrder.id
          ? pendingOrder
          : null;

      if (!order) {
        const result = await onPay({
          fulfillmentType,
          deliveryAddress:
            fulfillmentType === "delivery"
              ? normalizedDeliveryAddress
              : "",
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
      <section className="payment-feedback-state processing">
        <div className="payment-feedback-icon">
          <span>◷</span>
          <i />
        </div>

        <p className="eyebrow">
          PAGAMENTO SEGURO
        </p>

        <h1>
          Confirmando seu pagamento...
        </h1>

        <p>
          Recebemos o retorno da Stripe e estamos
          validando o pagamento do seu pedido. Isso
          deve levar apenas alguns instantes.
        </p>

        <div className="payment-feedback-progress">
          <span />
        </div>

        <small>
          Não feche nem atualize esta página.
        </small>
      </section>
    );
  }

  if (
    !paid &&
    checkoutItems.length === 0
  ) {
    return (
      <section className="payment-feedback-state empty">
        <div className="payment-feedback-icon">
          <span>🧁</span>
        </div>

        <p className="eyebrow">
          SEU CARRINHO ESTÁ VAZIO
        </p>

        <h1>
          Nenhum produto selecionado
        </h1>

        <p>
          Adicione produtos ao carrinho antes de
          continuar para o pagamento da sua
          encomenda.
        </p>
      </section>
    );
  }

  if (paid) {
    return (
      <section className="payment-feedback-state success">
        <div className="payment-feedback-icon">
          <span>✓</span>
        </div>

        <p className="eyebrow">
          PAGAMENTO APROVADO
        </p>

        <h1>
          Sua encomenda está confirmada!
        </h1>

        {confirmedOrderNumber && (
          <div className="confirmed-order-number">
            <small>
              NÚMERO DO PEDIDO
            </small>

            <strong>
              #{confirmedOrderNumber}
            </strong>
          </div>
        )}

        <p>
          {checkoutItems.length > 0
            ? `Seu pedido com ${totalItems} ${
                totalItems === 1
                  ? "item foi recebido"
                  : "itens foi recebido"
              }. A confeitaria já pode acompanhar e preparar sua encomenda.`
            : "Seu pagamento foi confirmado e o pedido já está disponível para a confeitaria."}
        </p>

        <Status>Confirmado</Status>

        <div className="payment-success-information">
          <article>
            <span>✓</span>

            <div>
              <b>Pagamento confirmado</b>

              <small>
                Transação processada com segurança
              </small>
            </div>
          </article>

          <article>
            <span>♨</span>

            <div>
              <b>Pedido enviado</b>

              <small>
                A confeitaria recebeu sua encomenda
              </small>
            </div>
          </article>

          <article>
            <span>▢</span>

            <div>
              <b>Acompanhe pelo sistema</b>

              <small>
                Consulte todas as atualizações
              </small>
            </div>
          </article>
        </div>

        <button
          type="button"
          className="payment-view-orders"
          onClick={onViewOrders}
        >
          Ver meus pedidos
          <span>→</span>
        </button>
      </section>
    );
  }

  return (
    <div className="client-payment-page">
      <header className="payment-page-hero">
        <div>
          <p className="eyebrow">
            FINALIZAÇÃO SEGURA
          </p>

          <h1>
            Finalize sua encomenda
          </h1>

          <p>
            Confira seus produtos, escolha como deseja
            receber e informe a melhor data para sua
            encomenda.
          </p>
        </div>

        <div className="payment-hero-security">
          <span>⌑</span>

          <div>
            <b>Pagamento protegido</b>

            <small>
              Processado pela Stripe
            </small>
          </div>
        </div>
      </header>

      <nav
        className="payment-steps"
        aria-label="Etapas da finalização"
      >
        <article className="completed">
          <span>✓</span>

          <div>
            <small>ETAPA 1</small>
            <b>Produtos</b>
          </div>
        </article>

        <i />

        <article className="active">
          <span>2</span>

          <div>
            <small>ETAPA 2</small>
            <b>Recebimento</b>
          </div>
        </article>

        <i />

        <article>
          <span>3</span>

          <div>
            <small>ETAPA 3</small>
            <b>Pagamento</b>
          </div>
        </article>
      </nav>

      {!acceptsOrders && (
        <div className="payment-orders-paused">
          <span>◷</span>

          <div>
            <b>
              Novas encomendas estão pausadas
            </b>

            <p>
              A confeitaria não está aceitando novos
              pedidos neste momento.
            </p>
          </div>
        </div>
      )}

      <div className="payment-layout">
        <main className="payment-checkout">
          <section className="payment-section-card">
            <header className="payment-section-heading">
              <span>1</span>

              <div>
                <small>
                  COMO VOCÊ QUER RECEBER?
                </small>

                <h2>
                  Forma de recebimento
                </h2>
              </div>
            </header>

            <div className="fulfillment-options">
              <button
                type="button"
                className={
                  fulfillmentType ===
                  "pickup"
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setFulfillmentType(
                    "pickup"
                  );

                  setPaymentError("");
                }}
              >
                <span>⌂</span>

                <div>
                  <strong>
                    Retirada no local
                  </strong>

                  <small>
                    Sem taxa de entrega
                  </small>
                </div>

                <i>
                  {fulfillmentType ===
                  "pickup"
                    ? "✓"
                    : ""}
                </i>
              </button>

              <button
                type="button"
                className={
                  fulfillmentType ===
                  "delivery"
                    ? "selected"
                    : ""
                }
                onClick={() => {
                  setFulfillmentType(
                    "delivery"
                  );

                  setPaymentError("");
                }}
              >
                <span>▣</span>

                <div>
                  <strong>
                    Receber em casa
                  </strong>

                  <small>
                    Taxa de{" "}
                    {money(deliveryFee)}
                  </small>
                </div>

                <i>
                  {fulfillmentType ===
                  "delivery"
                    ? "✓"
                    : ""}
                </i>
              </button>
            </div>

            {fulfillmentType ===
              "pickup" && (
              <div className="pickup-information">
                <span>⌂</span>

                <div>
                  <small>
                    LOCAL DE RETIRADA
                  </small>

                  <strong>
                    Retirada na confeitaria
                  </strong>

                  <p>
                    {pickupAddress ||
                      "Endereço de retirada a confirmar"}
                  </p>

                  <span>
                    {businessDays ||
                      "Dias de funcionamento a confirmar"}

                    {" • "}

                    {storeHours}
                  </span>
                </div>
              </div>
            )}

            {fulfillmentType ===
              "delivery" && (
              <div className="delivery-address-field">
                <label>
                  <span>
                    Endereço para entrega
                  </span>

                  <div>
                    <i>⌖</i>

                    <input
                      required
                      type="text"
                      name="deliveryAddress"
                      minLength={
                        DELIVERY_ADDRESS_MIN_LENGTH
                      }
                      maxLength={
                        DELIVERY_ADDRESS_MAX_LENGTH
                      }
                      autoComplete="street-address"
                      value={deliveryAddress}
                      onChange={event => {
                        setDeliveryAddress(
                          event.target.value
                        );

                        setPaymentError("");
                      }}
                      placeholder="Rua, número, bairro e complemento"
                    />
                  </div>
                </label>
              </div>
            )}
          </section>

          <section className="payment-section-card">
            <header className="payment-section-heading">
              <span>2</span>

              <div>
                <small>
                  QUANDO DEVEMOS PREPARAR?
                </small>

                <h2>
                  Data e horário
                </h2>
              </div>
            </header>

            <div className="delivery-fields">
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

            <div className="payment-schedule-information">
              <span>◷</span>

              <p>
                Atendimento em{" "}
                <b>
                  {businessDays ||
                    "dias a confirmar"}
                </b>
                , das{" "}
                <b>{storeHours}</b>.
              </p>
            </div>
          </section>

          {minimumOrderValue > 0 && (
            <section
              className={`payment-minimum-card ${
                subtotal >=
                minimumOrderValue
                  ? "reached"
                  : ""
              }`}
            >
              <div>
                <span>
                  {subtotal >=
                  minimumOrderValue
                    ? "✓"
                    : "!"}
                </span>

                <div>
                  <b>
                    {subtotal >=
                    minimumOrderValue
                      ? "Valor mínimo atingido"
                      : "Pedido mínimo ainda não atingido"}
                  </b>

                  <p>
                    {subtotal >=
                    minimumOrderValue
                      ? "Sua encomenda já pode ser finalizada."
                      : `Adicione mais ${money(
                          minimumOrderValue -
                            subtotal
                        )} para continuar.`}
                  </p>
                </div>
              </div>

              <div className="payment-minimum-progress">
                <span
                  style={{
                    width: `${minimumOrderProgress}%`,
                  }}
                />
              </div>
            </section>
          )}

          <section className="payment-section-card">
            <header className="payment-section-heading">
              <span>3</span>

              <div>
                <small>
                  AMBIENTE PROTEGIDO
                </small>

                <h2>
                  Forma de pagamento
                </h2>
              </div>
            </header>

            <div className="stripe-checkout-note">
              <span>⌑</span>

              <div>
                <b>
                  Pagamento seguro pela Stripe
                </b>

                <p>
                  Você será direcionado para o ambiente
                  protegido da Stripe, onde poderá
                  consultar e selecionar as formas de
                  pagamento disponíveis.
                </p>
              </div>

              <strong>
                STRIPE
              </strong>
            </div>

            {(paymentError ||
              returnError) && (
              <div
                className="payment-error-message"
                role="alert"
              >
                <span>!</span>

                <p>
                  {paymentError ||
                    returnError}
                </p>
              </div>
            )}

            <button
              type="button"
              className="confirm-payment"
              disabled={
                processing ||
                !acceptsOrders
              }
              onClick={confirmOrder}
            >
              <span>
                {processing
                  ? "Abrindo ambiente seguro..."
                  : `Pagar ${money(
                      checkoutTotal
                    )}`}
              </span>

              <b>
                {processing
                  ? "◷"
                  : "→"}
              </b>
            </button>

            <div className="payment-security-list">
              <span>
                ✓ Dados protegidos
              </span>

              <span>
                ✓ Ambiente seguro
              </span>

              <span>
                ✓ Confirmação automática
              </span>
            </div>
          </section>
        </main>

        <aside className="payment-order-summary">
          <header>
            <div>
              <p className="eyebrow">
                SUA ENCOMENDA
              </p>

              <h2>
                Resumo do pedido
              </h2>
            </div>

            <span>
              {totalItems}{" "}
              {totalItems === 1
                ? "item"
                : "itens"}
            </span>
          </header>

          <div className="payment-summary-items">
            {checkoutItems.map(item => (
              <article
                key={item.product.id}
              >
                <div className="payment-summary-image">
                  {item.product.image ? (
                    <img
                      src={
                        item.product.image
                      }
                      alt={
                        item.product.name
                      }
                    />
                  ) : (
                    <span>🍰</span>
                  )}

                  <b>
                    {item.quantity}
                  </b>
                </div>

                <div>
                  <strong>
                    {item.product.name}
                  </strong>

                  <small>
                    {item.quantity} ×{" "}
                    {item.product.price}
                  </small>
                </div>

                <span>
                  {money(
                    priceNumber(
                      item.product.price
                    ) * item.quantity
                  )}
                </span>
              </article>
            ))}
          </div>

          <div className="payment-summary-values">
            <div>
              <span>Subtotal</span>

              <b>{money(subtotal)}</b>
            </div>

            <div>
              <span>
                {fulfillmentType ===
                "delivery"
                  ? "Taxa de entrega"
                  : "Retirada no local"}
              </span>

              <b>
                {fulfillmentType ===
                "delivery"
                  ? money(
                      appliedDeliveryFee
                    )
                  : "Grátis"}
              </b>
            </div>
          </div>

          <div className="payment-summary-total">
            <span>Total</span>

            <strong>
              {money(checkoutTotal)}
            </strong>
          </div>

          <footer>
            <span>⌑</span>

            <p>
              O prazo será confirmado pela
              confeitaria após o recebimento do
              pedido.
            </p>
          </footer>
        </aside>
      </div>
    </div>
  );
}