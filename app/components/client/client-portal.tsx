"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import type {
  CartItem,
  CheckoutOrderOptions,
  ClientOrderRow,
  ClientSection,
  OrderCreationResult,
  Product,
  Quote,
  Role,
  StoreSettings,
  UserProfile,
} from "../../types";

import {
  formatDeliveryDate,
  formatOrderDate,
  getFirstName,
  getInitials,
  money,
  orderStatusLabel,
  todayInputDate,
} from "../../lib/formatters";

import {
  ProductVisual,
  Status,
} from "../ui";

import { MiniCart } from "./mini-cart";
import { OrderTimeline } from "./order-timeline";
import { Payment } from "./payment";
import { Review } from "./review";
import { ClientQuotes } from "./client-quotes";
import { ClientCatalog } from "./client-catalog";

export function ClientPortal({
  userProfile,
  onProfileChange,
  products,
  quotes,
  storeSettings,
  storeSettingsLoading,
  onQuote,
  unreadNotificationsCount,
  onOpenNotifications,
  onLogout,
}: {
  userProfile: UserProfile;

  onProfileChange: (
    profile: UserProfile
  ) => void;

  products: Product[];
  quotes: Quote[];

  storeSettings: StoreSettings | null;
  storeSettingsLoading: boolean;

  onQuote: (
    id: string,
    decision: "approved" | "rejected"
  ) => Promise<boolean>;

  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onLogout: () => void;
}) {
  const userName =
  userProfile.full_name || "Cliente";
  const [section, setSection] =
  useState<ClientSection>("inicio");
  const [clientOrders, setClientOrders] =
    useState<ClientOrderRow[]>([]);

  const [ordersLoading, setOrdersLoading] =
    useState(true);
  const [
    sectionRestored,
    setSectionRestored,
  ] = useState(false);

  const [quoteLoading, setQuoteLoading] =
  useState(false);

  const [quoteError, setQuoteError] =
    useState("");

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileFormError, setProfileFormError] =
    useState("");

  const [profileSaved, setProfileSaved] =
    useState(false);

  const [
    createdQuoteNumber,
    setCreatedQuoteNumber,
  ] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [paid, setPaid] = useState(false);
  const [
    paymentReturnLoading,
    setPaymentReturnLoading,
  ] = useState(false);

  const [
    paymentReturnError,
    setPaymentReturnError,
  ] = useState("");

  const [
    confirmedPaymentOrderNumber,
    setConfirmedPaymentOrderNumber,
  ] = useState<number | null>(null);
  const [reviewed, setReviewed] =
    useState(false);

  const [stars, setStars] =
    useState(0);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [reviewError, setReviewError] =
    useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartToast, setCartToast] = useState("");
  const [requestOrder, setRequestOrder] = useState<string | null>(null);
  const [requestLoading, setRequestLoading,] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId,] = useState<string | null>(null);
  const storeName =
    storeSettings?.store_name || "FriBolos";

  const storeWhatsapp =
    storeSettings?.whatsapp || "";

  const storeOpeningTime =
    storeSettings?.opening_time
      ? storeSettings.opening_time.slice(0, 5)
      : "";

  const storeClosingTime =
    storeSettings?.closing_time
      ? storeSettings.closing_time.slice(0, 5)
      : "";

  const storeBusinessDays =
    storeSettings?.business_days || "";

  const storeAcceptsOrders =
    storeSettings?.accepts_orders ?? true;

  const whatsappDigits =
    storeWhatsapp.replace(/\D/g, "");

  const whatsappNumber =
    whatsappDigits &&
    !whatsappDigits.startsWith("55")
      ? `55${whatsappDigits}`
      : whatsappDigits;

  const whatsappMessage =
    encodeURIComponent(
      `Olá! Sou ${userName} e gostaria de falar sobre uma encomenda.`
    );

  const whatsappUrl =
    whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
      : "";
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedSection =
        sessionStorage.getItem(
          "fribolos-client-section"
        ) as ClientSection | null;

      const validSections: ClientSection[] = [
        "inicio",
        "catalogo",
        "pedidos",
        "orcamentos",
        "novo",
        "pagamento",
        "avaliacao",
        "perfil",
      ];

      if (
        savedSection &&
        validSections.includes(savedSection)
      ) {
        setSection(savedSection);
      }

      setSectionRestored(true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!sectionRestored) {
      return;
    }

    sessionStorage.setItem(
      "fribolos-client-section",
      section
    );
  }, [section, sectionRestored]);

  function addToCart(product: Product) {
    if (!storeAcceptsOrders) {
      setCartToast(
        "A confeitaria não está aceitando novos pedidos no momento."
      );

      setTimeout(() => {
        setCartToast("");
      }, 3000);

      return;
    }

    setCart(current =>
      current.some(
        item =>
          item.product.id === product.id
      )
        ? current.map(item =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
              : item
          )
        : [
            ...current,
            {
              product,
              quantity: 1,
            },
          ]
    );

    setCartToast(
      `${product.name} adicionado ao carrinho`
    );

    setTimeout(() => {
      setCartToast("");
    }, 2200);
  }

  function changeQuantity(id: Product["id"], delta: number) { setCart(current => current.map(item => item.product.id === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0)) }
  
  async function loadClientOrders() {
    setOrdersLoading(true);

    try {
      const {
        data,
        error: ordersError,
      } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
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
            id,
            product_id,
            product_name,
            unit_price,
            quantity,
            customization,
            products (
              image_url
            )
          ),
          reviews (
            id,
            rating,
            comment,
            created_at
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (ordersError) {
        console.error(
          "Erro ao carregar pedidos:",
          ordersError
        );

        return;
      }

    const normalizedOrders =
      ((data || []) as ClientOrderRow[]).map(
        order => ({
          ...order,

          order_items:
            (order.order_items || []).map(
              item => ({
                ...item,
                products:
                  item.products || [],
              })
            ),

          reviews:
            order.reviews || [],
        })
      );

    setClientOrders(normalizedOrders);

    } catch (error) {
      console.error(
        "Erro inesperado ao carregar pedidos:",
        error
      );
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadClientOrders();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (section !== "avaliacao") {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadClientOrders();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [section]);

  useEffect(() => {
    let active = true;

    async function handleStripeReturn() {
      const url =
        new URL(window.location.href);

      const paymentResult =
        url.searchParams.get("payment");

      const sessionId =
        url.searchParams.get("session_id");

      if (!paymentResult) {
        return;
      }

      setSection("pagamento");

      sessionStorage.setItem(
        "fribolos-client-section",
        "pagamento"
      );

      const savedCart =
        sessionStorage.getItem(
          "stripe-checkout-cart"
        );

      if (savedCart) {
        try {
          const parsedCart =
            JSON.parse(savedCart) as CartItem[];

          setPurchasedItems(parsedCart);

          if (paymentResult === "cancelled") {
            setCart(parsedCart);
          }
        } catch (cartError) {
          console.error(
            "Erro ao recuperar carrinho:",
            cartError
          );
        }
      }

      if (paymentResult === "cancelled") {
        setPaymentReturnError(
          "O pagamento foi cancelado. Você pode tentar novamente."
        );

        window.history.replaceState(
          {},
          "",
          window.location.pathname
        );

        return;
      }

      if (
        paymentResult !== "success" ||
        !sessionId
      ) {
        setPaymentReturnError(
          "Não foi possível identificar o retorno do pagamento."
        );

        return;
      }

      setPaymentReturnLoading(true);
      setPaymentReturnError("");

      /*
      * Aguarda o webhook confirmar o pagamento.
      * O redirecionamento pode chegar antes dele.
      */
      for (
        let attempt = 0;
        attempt < 12;
        attempt += 1
      ) {
        if (!active) {
          return;
        }

        const {
          data: payment,
          error: paymentError,
        } = await supabase
          .from("payments")
          .select(`
            order_id,
            status
          `)
          .eq(
            "stripe_checkout_session_id",
            sessionId
          )
          .maybeSingle();

        if (paymentError) {
          console.error(
            "Erro ao verificar pagamento:",
            paymentError
          );
        }

        if (payment?.status === "paid") {
          const {
            data: order,
            error: orderError,
          } = await supabase
            .from("orders")
            .select("order_number")
            .eq("id", payment.order_id)
            .single();

          if (orderError) {
            console.error(
              "Erro ao carregar pedido pago:",
              orderError
            );
          }

          if (!active) {
            return;
          }

          const savedOrderNumber =
            sessionStorage.getItem(
              "stripe-checkout-order-number"
            );

          setConfirmedPaymentOrderNumber(
            Number(
              order?.order_number ||
                savedOrderNumber ||
                0
            ) || null
          );

          setPaid(true);
          setCart([]);

          sessionStorage.removeItem(
            "stripe-checkout-cart"
          );

          sessionStorage.removeItem(
            "stripe-checkout-order-number"
          );

          sessionStorage.removeItem(
            "stripe-checkout-order-id"
          );

          await loadClientOrders();

          setPaymentReturnLoading(false);

          window.history.replaceState(
            {},
            "",
            window.location.pathname
          );

          return;
        }

        await new Promise(resolve =>
          setTimeout(resolve, 1000)
        );
      }

      if (active) {
        setPaymentReturnLoading(false);

        setPaymentReturnError(
          "O pagamento foi recebido e ainda está sendo confirmado. Aguarde alguns segundos e atualize a página."
        );
      }
    }

    handleStripeReturn();

    return () => {
      active = false;
    };
  }, []);

  async function createOrderFromCart(
    options: CheckoutOrderOptions
  ): Promise<OrderCreationResult> {
    if (cart.length === 0) {
      return {
        success: false,
        message: "O carrinho está vazio.",
      };
    }

    try {
      const items = cart.map(item => ({
        product_id: String(item.product.id),
        quantity: item.quantity,
        customization: {},
      }));

      const {
        data,
        error: orderError,
      } = await supabase.rpc(
        "create_client_order",
        {
          p_items: items,

          p_delivery_date:
            options.deliveryDate || null,

          p_delivery_time:
            options.deliveryTime || null,

          p_notes: null,

          p_fulfillment_type:
            options.fulfillmentType,

          p_delivery_address:
            options.fulfillmentType ===
            "delivery"
              ? options.deliveryAddress
              : null,
        }
      );

      if (orderError) {
        console.error(
          "Erro ao criar pedido:",
          orderError
        );

        return {
          success: false,
          message:
            orderError.message ||
            "Não foi possível criar o pedido.",
        };
      }

      const createdOrder = data as {
        order_id: string;
        order_number: number | string;
      };

      if (!createdOrder.order_id) {
        console.error(
          "A função não retornou o ID do pedido:",
          createdOrder
        );

        return {
          success: false,
          message:
            "O pedido foi criado, mas seu identificador não foi retornado.",
        };
      }

      // setPurchasedItems(cart);
      // setPaid(true);
      // setCart([]);
      // await loadClientOrders();

      return {
        success: true,
        orderId: createdOrder.order_id,
        orderNumber: Number(
          createdOrder.order_number
        ),
      };
    } catch (error) {
      console.error(
        "Erro inesperado ao criar pedido:",
        error
      );

      return {
        success: false,
        message:
          "Ocorreu um erro ao criar o pedido.",
      };
    }
  }

  const latestOrder =
  clientOrders[0] || null;

  const latestOrderProductImage =
    latestOrder?.order_items
      .flatMap(
        item => item.products || []
      )
      .find(
        product => product.image_url
      )
      ?.image_url || "";

  const latestOrderDescription =
    latestOrder
      ? latestOrder.order_items
          .map(
            item =>
              `${item.quantity}× ${item.product_name}`
          )
          .join(", ")
      : "";

  const latestOrderStatus =
    latestOrder
      ? orderStatusLabel(latestOrder.status)
      : "Aguardando";

  const latestOrderPaid =
    latestOrder?.payment_status === "paid";

  const reviewableOrders =
    clientOrders.filter(
      order =>
        order.status === "completed" &&
        (order.reviews?.length || 0) === 0
    );
    
  const completedOrdersCount =
    clientOrders.filter(
      order => order.status === "completed"
    ).length;

  async function requestOrderChange(
    orderId: string,
    requestType:
      | "cancellation"
      | "reschedule",
    requestedDate: string | null = null,
    requestedTime: string | null = null,
    reason: string | null = null
  ) {
    setRequestLoading(orderId);

    try {
      const {
        error: requestError,
      } = await supabase.rpc(
        "request_order_change",
        {
          p_order_id: orderId,
          p_request_type: requestType,
          p_requested_date: requestedDate,
          p_requested_time: requestedTime,
          p_reason: reason,
        }
      );

      if (requestError) {
        console.error(
          "Erro ao enviar solicitação:",
          requestError
        );

        setCartToast(
          requestError.message ||
            "Não foi possível enviar a solicitação."
        );

        setTimeout(() => {
          setCartToast("");
        }, 3500);

        return false;
      }

      await loadClientOrders();

      setCartToast(
        requestType === "cancellation"
          ? "Solicitação de cancelamento enviada!"
          : "Solicitação de reagendamento enviada!"
      );

      setTimeout(() => {
        setCartToast("");
      }, 2800);

      return true;
    } catch (error) {
      console.error(
        "Erro inesperado na solicitação:",
        error
      );

      setCartToast(
        "Ocorreu um erro ao enviar a solicitação."
      );

      setTimeout(() => {
        setCartToast("");
      }, 3500);

      return false;
    } finally {
      setRequestLoading(null);
    }
  }

  async function requestCancellation(
    order: ClientOrderRow
  ) {
    const confirmed = window.confirm(
      `Solicitar o cancelamento do pedido #${order.order_number}?`
    );

    if (!confirmed) {
      return;
    }

    await requestOrderChange(
      order.id,
      "cancellation"
    );
  }

  async function submitReschedule(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!requestOrder) {
      return;
    }

    const data = new FormData(
      e.currentTarget
    );

    const requestedDate = String(
      data.get("date") || ""
    );

    if (
      requestedDate &&
      requestedDate < todayInputDate()
    ) {
      setCartToast(
        "A nova data não pode ser anterior a hoje."
      );

      setTimeout(() => {
        setCartToast("");
      }, 3500);

      return;
    }

    const success =
      await requestOrderChange(
        requestOrder,
        "reschedule",
        String(data.get("date") || ""),
        String(data.get("time") || "") ||
          null,
        String(data.get("reason") || "") ||
          null
      );

    if (success) {
      setRequestOrder(null);
    }
  }

  async function submitQuoteRequest(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    if (!storeAcceptsOrders) {
      setQuoteError(
        "A confeitaria não está aceitando novas solicitações no momento."
      );

      return;
    }

    const form = e.currentTarget;
    const data = new FormData(form);

    const desiredDate = String(
      data.get("date") || ""
    );

    if (
      desiredDate &&
      desiredDate < todayInputDate()
    ) {
      setQuoteError(
        "A data desejada não pode ser anterior a hoje."
      );

      return;
    }

    const referenceImageValue =
      data.get("referenceImage");

    const referenceImage =
      referenceImageValue instanceof File &&
      referenceImageValue.size > 0
        ? referenceImageValue
        : null;

    const productType = String(
      data.get("productType") ||
        "Pedido personalizado"
    );

    const people = String(
      data.get("people") || ""
    );

    const baseDetails = String(
      data.get("details") || ""
    ).trim();

    const customizationDetails =
      selectedProduct?.options
        .map(option => {
          const value = String(
            data.get(
              `customization-${option}`
            ) || ""
          );

          return value
            ? `${option}: ${value}`
            : "";
        })
        .filter(Boolean) || [];

    const completeDetails = [
      baseDetails,
      people
        ? `Quantidade de pessoas: ${people}`
        : "",
      ...customizationDetails,
    ]
      .filter(Boolean)
      .join("\n");

    setQuoteError("");
    setQuoteLoading(true);
    setSent(false);

    let uploadedImagePath: string | null =
      null;

    try {
      if (referenceImage) {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

        if (
          !allowedTypes.includes(
            referenceImage.type
          )
        ) {
          setQuoteError(
            "Envie uma imagem JPG, PNG ou WEBP."
          );

          return;
        }

        if (
          referenceImage.size >
          5 * 1024 * 1024
        ) {
          setQuoteError(
            "A imagem deve possuir no máximo 5 MB."
          );

          return;
        }

        const {
          data: userData,
          error: userError,
        } = await supabase.auth.getUser();

        if (
          userError ||
          !userData.user
        ) {
          console.error(
            "Erro ao identificar usuário:",
            userError
          );

          setQuoteError(
            "Não foi possível identificar sua conta."
          );

          return;
        }

        const extension =
          referenceImage.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        uploadedImagePath =
          `${userData.user.id}/${crypto.randomUUID()}.${extension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("quote-images")
          .upload(
            uploadedImagePath,
            referenceImage,
            {
              cacheControl: "3600",
              upsert: false,
              contentType: referenceImage.type,
            }
          );

        if (uploadError) {
          console.error(
            "Erro ao enviar referência:",
            uploadError
          );

          setQuoteError(
            "Não foi possível enviar a imagem."
          );

          return;
        }
      }
      const {
        data: createdQuote,
        error: quoteRequestError,
      } = await supabase.rpc(
        "create_quote_request",
        {
          p_title:
            productType ||
            "Pedido personalizado",
          p_details: completeDetails,
          p_desired_date:
            String(data.get("date") || "") ||
            null,
          p_desired_time:
            String(data.get("time") || "") ||
            null,
          p_reference_image_url:
            uploadedImagePath,
        }
      );

      if (quoteRequestError) {
        console.error(
          "Erro ao solicitar orçamento:",
          quoteRequestError
        );
        
        if (uploadedImagePath) {
          await supabase.storage
            .from("quote-images")
            .remove([uploadedImagePath]);
        }

        setQuoteError(
          quoteRequestError.message ||
            "Não foi possível solicitar o orçamento."
        );

        return;
      }

      const result = createdQuote as {
        quote_number: number | string;
      };

      setCreatedQuoteNumber(
        Number(result.quote_number)
      );

      setSent(true);
      setSelectedProduct(null);
      form.reset();
    } catch (error) {
      console.error(
        "Erro inesperado no orçamento:",
        error
      );

      if (uploadedImagePath) {
        await supabase.storage
          .from("quote-images")
          .remove([uploadedImagePath]);
      }
      
      setQuoteError(
        "Ocorreu um erro ao solicitar o orçamento."
      );
    } finally {
      setQuoteLoading(false);
    }
  }

  async function submitOrderReview(
    orderId: string,
    comment: string
  ): Promise<boolean> {
    if (stars < 1 || stars > 5) {
      setReviewError(
        "Selecione uma nota entre 1 e 5 estrelas."
      );

      return false;
    }

    if (!comment.trim()) {
      setReviewError(
        "Escreva um comentário sobre o pedido."
      );

      return false;
    }

    setReviewLoading(true);
    setReviewError("");

    try {
      const {
        error: reviewRequestError,
      } = await supabase.rpc(
        "submit_order_review",
        {
          p_order_id: orderId,
          p_rating: stars,
          p_comment: comment.trim(),
        }
      );

      if (reviewRequestError) {
        console.error(
          "Erro ao enviar avaliação:",
          reviewRequestError
        );

        setReviewError(
          reviewRequestError.message ||
            "Não foi possível enviar a avaliação."
        );

        return false;
      }

      await loadClientOrders();

      setReviewed(true);
      return true;
    } catch (error) {
      console.error(
        "Erro inesperado ao enviar avaliação:",
        error
      );

      setReviewError(
        "Ocorreu um erro ao enviar a avaliação."
      );

      return false;
    } finally {
      setReviewLoading(false);
    }
  }

  async function saveClientProfile(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const formData =
      new FormData(e.currentTarget);

    const fullName = String(
      formData.get("fullName") || ""
    ).trim();

    if (!fullName) {
      setProfileFormError(
        "Informe seu nome completo."
      );
      return;
    }

    setProfileSaving(true);
    setProfileFormError("");
    setProfileSaved(false);

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error(
          "Erro ao identificar usuário:",
          userError
        );

        setProfileFormError(
          "Não foi possível identificar sua conta."
        );
        return;
      }

      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,

          phone:
            String(
              formData.get("phone") || ""
            ).trim() || null,

          birth_date:
            String(
              formData.get("birthDate") || ""
            ) || null,

          zip_code:
            String(
              formData.get("zipCode") || ""
            ).trim() || null,

          street:
            String(
              formData.get("street") || ""
            ).trim() || null,

          address_number:
            String(
              formData.get("addressNumber") || ""
            ).trim() || null,

          complement:
            String(
              formData.get("complement") || ""
            ).trim() || null,

          district:
            String(
              formData.get("district") || ""
            ).trim() || null,

          city:
            String(
              formData.get("city") || ""
            ).trim() || null,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", userData.user.id)
        .select(`
          full_name,
          role,
          phone,
          birth_date,
          zip_code,
          street,
          address_number,
          complement,
          district,
          city
        `)
        .single();

      if (updateError || !updatedProfile) {
        console.error(
          "Erro ao atualizar perfil:",
          updateError
        );

        setProfileFormError(
          updateError?.message ||
            "Não foi possível atualizar seus dados."
        );

        return;
      }

      onProfileChange({
        ...updatedProfile,
        role: updatedProfile.role as Role,
        email: userProfile.email,
      });

      setProfileSaved(true);

      setTimeout(() => {
        setProfileSaved(false);
      }, 2800);
    } catch (error) {
      console.error(
        "Erro inesperado ao atualizar perfil:",
        error
      );

      setProfileFormError(
        "Ocorreu um erro ao atualizar seus dados."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function payExistingOrder(
    order: ClientOrderRow
  ) {
    setPayingOrderId(order.id);
    setCartToast("");

    try {
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
          const errorContext = (
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
          "Erro ao pagar pedido existente:",
          checkoutError
        );

        setCartToast(errorMessage);

        setTimeout(() => {
          setCartToast("");
        }, 3500);

        return;
      }

      const checkoutUrl =
        data?.url as string | undefined;

      if (!checkoutUrl) {
        setCartToast(
          data?.error ||
            "A Stripe não retornou a página de pagamento."
        );

        setTimeout(() => {
          setCartToast("");
        }, 3500);

        return;
      }

      /*
      * Este pagamento não veio do carrinho atual.
      * Remove qualquer carrinho antigo para não aparecer
      * na confirmação deste pedido.
      */
      sessionStorage.removeItem(
        "stripe-checkout-cart"
      );

      sessionStorage.setItem(
        "stripe-checkout-order-id",
        order.id
      );

      sessionStorage.setItem(
        "stripe-checkout-order-number",
        String(order.order_number)
      );

      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error(
        "Erro inesperado ao pagar pedido:",
        error
      );

      setCartToast(
        "Ocorreu um erro ao iniciar o pagamento."
      );

      setTimeout(() => {
        setCartToast("");
      }, 3500);
    } finally {
      setPayingOrderId(null);
    }
  }

  async function answerClientQuote(
    quoteId: string,
    decision: "approved" | "rejected"
  ) {
    const success = await onQuote(
      quoteId,
      decision
    );

    if (
      success &&
      decision === "approved"
    ) {
      await loadClientOrders();
      setSection("pedidos");
    }

    return success;
  }

  return (
    <main className="client-portal">
      <header className="client-header">
        <div className="login-brand compact"><span>♨</span><strong>{storeName}</strong></div>
        <nav>
          <button className={section === "inicio" ? "active" : ""} onClick={() => setSection("inicio")}>Início</button>
          <button className={section === "catalogo" ? "active" : ""} onClick={() => setSection("catalogo")}>Catálogo</button>
          <button className={section === "pedidos" ? "active" : ""} onClick={() => setSection("pedidos")}>Meus pedidos</button>
          <button className={section === "orcamentos" ? "active" : ""} onClick={() => setSection("orcamentos")}>Orçamentos</button>
          <button className={section === "pagamento" ? "active" : ""} onClick={() => setSection("pagamento")}>Pagamento</button>
          <button className={section === "avaliacao" ? "active" : ""} onClick={() => setSection("avaliacao")}>Avaliar</button>
        </nav>
        <div className="client-account">
          <button
            type="button"
            className="client-notification-button"
            onClick={onOpenNotifications}
            aria-label={`Abrir notificações. ${unreadNotificationsCount} não lidas`}
          >
            <span>♧</span>

            {unreadNotificationsCount > 0 && (
              <b>
                {unreadNotificationsCount > 99
                  ? "99+"
                  : unreadNotificationsCount}
              </b>
            )}
          </button>
          <button className="cart-trigger" onClick={() => setCartOpen(true)} aria-label={`Abrir carrinho com ${cartCount} itens`}><span>🛒</span><b>{cartCount}</b></button>
          <span className="initials">
            {getInitials(userName)}
          </span>
          <button onClick={() => setSection("perfil")}>
            {userName}
          </button>
          <button onClick={onLogout} className="logout">Sair</button>
        </div>
      </header>
      <section className="client-main">
        {section === "inicio" && <>
          <div className="client-welcome"><div><p className="eyebrow">OLÁ, {getFirstName(userName).toUpperCase()}</p><h1>Seus momentos doces,<br />sempre por perto.</h1><span>Acompanhe suas encomendas e fale com a confeitaria.</span></div><button  type="button"  disabled={    storeSettingsLoading ||    !storeAcceptsOrders  }  onClick={() => {    if (!storeAcceptsOrders) {      return;    }    setSection("novo");  }}>  {storeSettingsLoading    ? "Carregando..."    : storeAcceptsOrders      ? "＋ Fazer nova encomenda"      : "Encomendas pausadas"}</button></div>
          {!storeSettingsLoading &&
            !storeAcceptsOrders && (
              <div className="orders-paused-notice">
                <span>◷</span>

                <div>
                  <strong>
                    Novas encomendas estão pausadas
                  </strong>

                  <p>
                    A confeitaria não está recebendo novos
                    pedidos no momento. Seus pedidos já
                    realizados continuam disponíveis.
                  </p>
                </div>
              </div>
            )}
          <div className="client-grid-main">
            <section className="panel current-order">
              {ordersLoading ? (
                <div className="empty-cart">
                  <span>♨</span>
                  <h3>Carregando seu pedido...</h3>
                </div>
              ) : latestOrder ? (
                <>
                  <div className="client-panel-title">
                    <div>
                      <span className="latest-order-visual">
                        {latestOrderProductImage ? (
                          <img
                            src={latestOrderProductImage}
                            alt={
                              latestOrderDescription ||
                              "Produto do último pedido"
                            }
                          />
                        ) : (
                          <span>🍰</span>
                        )}
                      </span>

                      <div>
                        <small>ÚLTIMO PEDIDO</small>
                        <h2>
                          {latestOrderDescription}
                        </h2>
                      </div>
                    </div>

                    <Status>
                      {latestOrderStatus}
                    </Status>
                  </div>

                  <div className="order-detail-row">
                    <div>
                      <small>Pedido</small>
                      <b>#{latestOrder.order_number}</b>
                    </div>

                    <div>
                      <small>Entrega</small>

                      <b>
                        {formatDeliveryDate(
                          latestOrder.delivery_date
                        )}

                        {latestOrder.delivery_time &&
                          `, ${latestOrder.delivery_time.slice(
                            0,
                            5
                          )}`}
                      </b>
                    </div>

                    <div>
                      <small>Valor</small>

                      <b>
                        {money(
                          Number(
                            latestOrder.total_amount
                          )
                        )}
                      </b>
                    </div>
                  </div>

                  <OrderTimeline
                    status={latestOrderStatus}
                    paid={latestOrderPaid}
                  />
                </>
              ) : (
                <div className="empty-cart">
                  <span>🧁</span>

                  <h3>Nenhum pedido realizado</h3>

                  <p>
                    Escolha produtos no catálogo para
                    realizar sua primeira encomenda.
                  </p>

                  <button
                    onClick={() =>
                      setSection("catalogo")
                    }
                  >
                    Ver catálogo
                  </button>
                </div>
              )}
            </section>
            <aside className="panel contact-card"><span>♡</span><h2>Precisa de ajuda?</h2><p>Fale diretamente com a confeitaria sobre seu pedido.</p><button  type="button"  disabled={    storeSettingsLoading ||    !whatsappUrl  }  onClick={() => {    if (!whatsappUrl) {      return;    }    window.open(      whatsappUrl,      "_blank",      "noopener,noreferrer"    );  }}>  {storeSettingsLoading    ? "Carregando contato..."    : whatsappUrl      ? "Conversar no WhatsApp"      : "WhatsApp indisponível"}</button><small>  {storeBusinessDays && (    <>      {storeBusinessDays}      <br />    </>  )}  {storeOpeningTime &&  storeClosingTime    ? `Atendimento: ${storeOpeningTime} às ${storeClosingTime}`    : "Consulte nosso horário de atendimento"}</small></aside>
          </div>
          <div className="client-stats">
            <article>
              <span>▢</span>

              <div>
                <b>{clientOrders.length}</b>
                <small>Pedidos realizados</small>
              </div>
            </article>

            <article>
              <span>✓</span>

              <div>
                <b>{completedOrdersCount}</b>
                <small>Pedidos entregues</small>
              </div>
            </article>

            {/* <article>
              <span>$</span>

              <div>
                <b>{money(totalPaidByClient)}</b>
                <small>Total Gasto</small>
              </div>
            </article> */}
          </div>
        </>}
        {section === "pedidos" && (
          <>
            <div className="client-page-title">
              <p className="eyebrow">HISTÓRICO</p>
              <h1>Meus pedidos</h1>

              <span>
                Acompanhe suas encomendas realizadas.
              </span>
            </div>

            <section className="panel client-orders">
              {ordersLoading && (
                <div className="empty-cart">
                  <span>♨</span>
                  <h3>Carregando pedidos...</h3>
                </div>
              )}

              {!ordersLoading &&
                clientOrders.length === 0 && (
                  <div className="empty-cart">
                    <span>🧁</span>

                    <h3>
                      Você ainda não possui pedidos
                    </h3>

                    <p>
                      Adicione produtos ao carrinho para
                      realizar sua primeira encomenda.
                    </p>
                  </div>
                )}

              {!ordersLoading &&
                clientOrders.map(order => {
                  const itemDescription =
                    order.order_items
                      .map(
                        item =>
                          `${item.quantity}× ${item.product_name}`
                      )
                      .join(", ");

                  const orderProductImage =
                    order.order_items
                      .map(item =>
                        products.find(
                          product =>
                            String(product.id) ===
                            String(item.product_id)
                        )
                      )
                      .find(product => Boolean(product?.image))
                      ?.image || "";

                  const deliveryDescription =
                    `${formatDeliveryDate(
                      order.delivery_date
                    )}${
                      order.delivery_time
                        ? ` às ${order.delivery_time.slice(
                            0,
                            5
                          )}`
                        : ""
                    }`;

                  const isDelivery =
                    order.fulfillment_type ===
                    "delivery";

                  const orderSubtotal =
                    Number(order.subtotal_amount);

                  const orderDeliveryFee =
                    Number(order.delivery_fee);

                  const hasPendingRequest =
                    order.request_status === "pending";

                  const canRequestChange =
                    !["ready", "completed", "cancelled"].includes(
                      order.status
                    );

                  const canPayOrder =
                    order.payment_status === "pending" &&
                    order.status !== "cancelled";

                  return (
                    <article key={order.id}>
                      <div className="product-mini">
                        {orderProductImage ? (
                          <img
                            src={orderProductImage}
                            alt={itemDescription}
                          />
                        ) : (
                          <span>🍰</span>
                        )}
                      </div>

                      <div>
                        <small>
                          #{order.order_number} •{" "}
                          {formatOrderDate(
                            order.created_at
                          )}
                        </small>

                        <h3>{itemDescription}</h3>

                        <div className="client-order-delivery">
                          <span className="fulfillment-badge">
                            {isDelivery
                              ? "▣ Entrega"
                              : "⌂ Retirada no local"}
                          </span>

                          <p>{deliveryDescription}</p>

                          {isDelivery &&
                            order.delivery_address && (
                              <small>
                                {order.delivery_address}
                              </small>
                            )}
                        </div>

                        <div className="client-order-values">
                          <span>
                            Subtotal:{" "}
                            <b>{money(orderSubtotal)}</b>
                          </span>

                          {isDelivery && (
                            <span>
                              Taxa de entrega:{" "}
                              <b>
                                {money(orderDeliveryFee)}
                              </b>
                            </span>
                          )}
                        </div>

                        {canPayOrder && (
                          <div className="order-payment-action">
                            <button
                              type="button"
                              className="pay-existing-order"
                              disabled={
                                payingOrderId === order.id
                              }
                              onClick={() =>
                                payExistingOrder(order)
                              }
                            >
                              {payingOrderId === order.id
                                ? "Abrindo pagamento..."
                                : `Pagar ${money(
                                    Number(order.total_amount)
                                  )}`}
                            </button>
                          </div>
                        )}

                        {hasPendingRequest && (
                          <span className="request-badge">
                            {order.request_type === "cancellation"
                              ? "Cancelamento em análise"
                              : "Reagendamento em análise"}
                          </span>
                        )}

                        {canRequestChange &&
                          !hasPendingRequest && (
                            <div className="order-request-actions">
                              <button
                                disabled={
                                  requestLoading === order.id
                                }
                                onClick={() =>
                                  setRequestOrder(order.id)
                                }
                              >
                                Reagendar
                              </button>

                              <button
                                disabled={
                                  requestLoading === order.id
                                }
                                onClick={() =>
                                  requestCancellation(order)
                                }
                              >
                                {requestLoading === order.id
                                  ? "Enviando..."
                                  : "Solicitar cancelamento"}
                              </button>
                            </div>
                          )}
                      </div>

                      <div>
                        <Status>
                          {orderStatusLabel(
                            order.status
                          )}
                        </Status>

                        <strong>
                          {money(
                            Number(order.total_amount)
                          )}
                        </strong>
                      </div>
                    </article>
                  );
                })}
            </section>
          </>
        )}
        {section === "orcamentos" && (
          <ClientQuotes
            quotes={quotes}
            onAnswer={answerClientQuote}
          />
        )}
        {section === "catalogo" && <ClientCatalog products={products.filter(p => p.active)} onChoose={p => { setSelectedProduct(p); setSection("novo") }} onAdd={addToCart} />}
        {section === "novo" && (
          <>
            <div className="client-page-title">
              <p className="eyebrow">
                NOVA ENCOMENDA
              </p>

              <h1>Conte seu desejo doce</h1>

              <span>
                Personalize os detalhes e solicite seu
                orçamento.
              </span>
            </div>

            {selectedProduct && (
              <div className="selected-product">
                <ProductVisual
                  product={selectedProduct}
                />

                <div>
                  <small>PRODUTO SELECIONADO</small>
                  <b>{selectedProduct.name}</b>

                  <span>
                    A partir de {selectedProduct.price}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedProduct(null)
                  }
                >
                  Trocar
                </button>
              </div>
            )}

            <form
              className="panel client-form"
              onSubmit={submitQuoteRequest}
            >
              <div className="form-grid">
                <label>
                  Tipo de produto

                  <select
                    name="productType"
                    value={
                      selectedProduct?.name || ""
                    }
                    onChange={e => {
                      const product =
                        products.find(
                          currentProduct =>
                            currentProduct.name ===
                            e.target.value
                        ) || null;

                      setSelectedProduct(product);
                    }}
                  >
                    <option value="">
                      Pedido personalizado
                    </option>

                    {products
                      .filter(product => product.active)
                      .map(product => (
                        <option
                          key={product.id}
                          value={product.name}
                        >
                          {product.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  Quantidade de pessoas

                  <input
                    name="people"
                    type="number"
                    min="1"
                    placeholder="Ex.: 30"
                  />
                </label>

                {selectedProduct?.customizable &&
                  selectedProduct.options.map(
                    option => (
                      <label key={option}>
                        {option}

                        <select
                          required
                          name={`customization-${option}`}
                          defaultValue=""
                        >
                          <option
                            value=""
                            disabled
                          >
                            Escolha uma opção
                          </option>

                          <option
                            value={
                              option === "Tamanho"
                                ? "Pequeno"
                                : "Tradicional"
                            }
                          >
                            {option === "Tamanho"
                              ? "Pequeno"
                              : "Tradicional"}
                          </option>

                          <option
                            value={
                              option === "Tamanho"
                                ? "Médio"
                                : "Especial"
                            }
                          >
                            {option === "Tamanho"
                              ? "Médio"
                              : "Especial"}
                          </option>

                          <option
                            value={
                              option === "Tamanho"
                                ? "Grande"
                                : "Premium"
                            }
                          >
                            {option === "Tamanho"
                              ? "Grande"
                              : "Premium"}
                          </option>
                        </select>
                      </label>
                    )
                  )}

                <label>
                  Data desejada

                  <input
                    required
                    name="date"
                    type="date"
                    min={todayInputDate()}
                  />
                </label>

                <label>
                  Horário preferido

                  <input
                    required
                    name="time"
                    type="time"
                  />
                </label>

                <label className="wide">
                  Tema, sabores e detalhes

                  <textarea
                    required
                    name="details"
                    placeholder="Conte como você imagina sua encomenda..."
                  />
                </label>

                <label className="wide">
                  Imagem de referência

                  <input
                    name="referenceImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                  />

                  <small>
                    JPG, PNG ou WEBP — máximo de 5 MB.
                  </small>
                </label>
              </div>

              <button
                className="primary"
                disabled={quoteLoading}
              >
                {quoteLoading
                  ? "Enviando solicitação..."
                  : "Solicitar orçamento"}
              </button>

              {quoteError && (
                <span className="form-error">
                  {quoteError}
                </span>
              )}

              {sent && (
                <span className="form-success">
                  ✓ Orçamento #{createdQuoteNumber} enviado!
                  Entraremos em contato em breve.
                </span>
              )}
            </form>
          </>
        )}
        {section === "pagamento" && (
          <Payment
            paid={paid}

            cart={
              paid
                ? purchasedItems
                : cart
            }

            onPay={createOrderFromCart}
            onViewOrders={() => {
              setSection("pedidos");
            }}

            returning={
              paymentReturnLoading
            }

            returnError={
              paymentReturnError
            }

            confirmedOrderNumber={
              confirmedPaymentOrderNumber
            }

            minimumOrderValue={
              Number(
                storeSettings
                  ?.minimum_order_value || 0
              )
            }

            deliveryFee={
              Number(
                storeSettings
                  ?.delivery_fee || 0
              )
            }

            acceptsOrders={
              storeAcceptsOrders
            }

            storeAddress={storeSettings?.address || ""}

            storeCity={storeSettings?.city || ""}

            storeState={storeSettings?.state || ""}

            storeZipCode={storeSettings?.zip_code || ""}

            openingTime={storeSettings?.opening_time || ""}

            closingTime={storeSettings?.closing_time || ""}

            businessDays={storeSettings?.business_days || ""}

            businessWeekdays={
              storeSettings?.business_weekdays || []
            }
          />
        )}
        {section === "avaliacao" && (
          <Review
            orders={reviewableOrders}
            products={products}
            reviewed={reviewed}
            stars={stars}
            setStars={setStars}
            loading={reviewLoading}
            error={reviewError}
            onSubmit={submitOrderReview}
          />
        )}
        {section === "perfil" && (
          <>
            <div className="client-page-title">
              <p className="eyebrow">
                MINHA CONTA
              </p>

              <h1>Dados pessoais</h1>

              <span>
                Atualize suas informações pessoais e seu
                endereço.
              </span>
            </div>

            <form
              className="panel settings"
              onSubmit={saveClientProfile}
            >
              <div className="form-grid">
                <label>
                  Nome completo

                  <input
                    required
                    name="fullName"
                    defaultValue={
                      userProfile.full_name
                    }
                  />
                </label>

                <label>
                  E-mail

                  <input
                    disabled
                    type="email"
                    value={userProfile.email}
                  />
                </label>

                <label>
                  Telefone

                  <input
                    name="phone"
                    defaultValue={
                      userProfile.phone || ""
                    }
                  />
                </label>

                <label>
                  Data de nascimento

                  <input
                    name="birthDate"
                    type="date"
                    defaultValue={
                      userProfile.birth_date || ""
                    }
                  />
                </label>

                <label>
                  CEP

                  <input
                    name="zipCode"
                    defaultValue={
                      userProfile.zip_code || ""
                    }
                  />
                </label>

                <label>
                  Rua

                  <input
                    name="street"
                    defaultValue={
                      userProfile.street || ""
                    }
                  />
                </label>

                <label>
                  Número

                  <input
                    name="addressNumber"
                    defaultValue={
                      userProfile.address_number || ""
                    }
                  />
                </label>

                <label>
                  Complemento

                  <input
                    name="complement"
                    defaultValue={
                      userProfile.complement || ""
                    }
                  />
                </label>

                <label>
                  Bairro

                  <input
                    name="district"
                    defaultValue={
                      userProfile.district || ""
                    }
                  />
                </label>

                <label>
                  Cidade

                  <input
                    name="city"
                    defaultValue={
                      userProfile.city || ""
                    }
                  />
                </label>
              </div>

              {profileFormError && (
                <p className="form-error">
                  {profileFormError}
                </p>
              )}

              {profileSaved && (
                <p className="form-success">
                  ✓ Dados atualizados com sucesso!
                </p>
              )}

              <button
                className="primary"
                type="submit"
                disabled={profileSaving}
              >
                {profileSaving
                  ? "Salvando alterações..."
                  : "Salvar alterações"}
              </button>
            </form>
          </>
        )}
      </section>
      {cartOpen && <MiniCart items={cart} onClose={() => setCartOpen(false)} onQuantity={changeQuantity} onCheckout={() => { setCartOpen(false); setPaid(false); setSection("pagamento") }} onCatalog={() => { setCartOpen(false); setSection("catalogo") }} />}
      {requestOrder && (
        <div
          className="modal-backdrop"
          onMouseDown={e => {
            if (e.currentTarget === e.target) {
              setRequestOrder(null);
            }
          }}
        >
          <form
            className="modal reschedule-modal"
            onSubmit={submitReschedule}
          >
            <div className="modal-title">
              <div>
                <p>REAGENDAMENTO</p>
                <h2>Escolha uma nova data</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRequestOrder(null)
                }
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                Nova data

                <input
                  required
                  name="date"
                  type="date"
                  min={todayInputDate()}
                />
              </label>

              <label>
                Novo horário

                <input
                  required
                  name="time"
                  type="time"
                />
              </label>

              <label className="wide">
                Motivo

                <textarea
                  name="reason"
                  placeholder="Conte o motivo da alteração..."
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                disabled={
                  requestLoading === requestOrder
                }
                onClick={() =>
                  setRequestOrder(null)
                }
              >
                Voltar
              </button>

              <button
                className="primary"
                disabled={
                  requestLoading === requestOrder
                }
              >
                {requestLoading === requestOrder
                  ? "Enviando..."
                  : "Enviar solicitação"}
              </button>
            </div>
          </form>
        </div>
      )}

      {cartToast && (
        <div className="toast">
          ✓ {cartToast}
        </div>
      )}
    </main>
  );
}
