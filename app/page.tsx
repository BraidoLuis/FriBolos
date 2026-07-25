"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

import type {
  AdminOrderRow,
  AppNotification,
  AppOrder,
  AppReview,
  ClientProfileRow,
  Product,
  ProductRow,
  Quote,
  QuoteRow,
  Role,
  Screen,
  StoreSettings,
  UserProfile,
} from "./types";

import {
  databasePrice,
  formatDeliveryDate,
  getFirstName,
  getInitials,
  money,
  normalizeSearch,
  orderStatusCode,
  orderStatusLabel,
} from "./lib/formatters";


import {
  mapAdminOrder,
  mapProduct,
  mapQuote,
} from "./lib/mappers";

import { Status } from "./components/ui";

import { ResetPassword } from "./components/auth/reset-password";
import { Login } from "./components/auth/login";
import { AdminQuotes } from "./components/admin/admin-quotes";
import { Inventory } from "./components/admin/inventory";
import { NotificationPanel } from "./components/notification-panel";
import { Dashboard } from "./components/admin/dashboard";
import { Orders } from "./components/admin/orders";
import { Production } from "./components/admin/production";
import { Catalog } from "./components/admin/catalog";
import { Clients } from "./components/admin/clients";
import { Finance } from "./components/admin/finance";
import { Reports } from "./components/admin/reports";
import { Settings } from "./components/admin/settings";
import { ClientPortal } from "./components/client/client-portal";

const weekdayOptions = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

const nav: { label: Screen; icon: string }[] = [
  { label: "Visão geral", icon: "⌂" },
  { label: "Pedidos", icon: "▢" },
  { label: "Orçamentos", icon: "◇" },
  { label: "Produção", icon: "♨" },
  { label: "Cardápio", icon: "▤" },
  { label: "Estoque", icon: "▦" },
  { label: "Clientes", icon: "♙" },
  { label: "Financeiro", icon: "$" },
  { label: "Relatórios", icon: "▥" },
  { label: "Configurações", icon: "⚙" },
];

export default function Home() {
  const [role, setRole] =
    useState<Role | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [screen, setScreen] =
    useState<Screen>("Visão geral");

  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");

  const [mobileNav, setMobileNav] =
    useState(false);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [appOrders, setAppOrders] =
    useState<AppOrder[]>([]);

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] = useState<string | null>(null);

  const [
    resolvingRequestId,
    setResolvingRequestId,
  ] = useState<string | null>(null);

  const [quotes, setQuotes] =
    useState<Quote[]>([]);

  const [
    updatingQuoteId,
    setUpdatingQuoteId,
  ] = useState<string | null>(null);

  const [
    passwordRecovery,
    setPasswordRecovery,
  ] = useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);

  const [reviews, setReviews] =
    useState<AppReview[]>([]);

  const [reviewsLoading, setReviewsLoading] =
    useState(false);

  const [orderClients, setOrderClients] =
    useState<ClientProfileRow[]>([]);

  const [
    orderClientsLoading,
    setOrderClientsLoading,
  ] = useState(false);

  const [savingOrder, setSavingOrder] =
    useState(false);

  const [
    adminFulfillmentType,
    setAdminFulfillmentType,
  ] = useState<
    "delivery" | "pickup"
  >("pickup");

  const [
    storeSettings,
    setStoreSettings,
  ] = useState<StoreSettings | null>(null);

  const [
    storeSettingsLoading,
    setStoreSettingsLoading,
  ] = useState(true);

  const [
    savingStoreSettings,
    setSavingStoreSettings,
  ] = useState(false);
  /*
   * Recupera a sessão do Supabase quando
   * o usuário atualiza ou reabre a página.
   */
  useEffect(() => {
    let componentActive = true;

    async function restoreSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!componentActive) {
          return;
        }

        if (sessionError) {
          console.error(
            "Erro ao recuperar sessão:",
            sessionError
          );

          setRole(null);
          setProfile(null);
          return;
        }

        if (!session?.user) {
          setRole(null);
          setProfile(null);
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
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
          .eq("id", session.user.id)
          .single();

        if (!componentActive) {
          return;
        }

        if (profileError || !profile) {
          console.error(
            "Erro ao recuperar perfil:",
            profileError
          );

          await supabase.auth.signOut();
          setRole(null);
          setProfile(null);
          return;
        }

        if (
          profile.role !== "admin" &&
          profile.role !== "client"
        ) {
          await supabase.auth.signOut();
          setRole(null);
          setProfile(null);
          return;
        }

        const profileRole =
          profile.role as Role;

        setRole(profileRole);

        setProfile({
          ...profile,
          role: profileRole,
          email: session.user.email || "",
        });
      } catch (connectionError) {
        console.error(
          "Erro ao restaurar a sessão:",
          connectionError
        );

        setRole(null);
        setProfile(null);
      } finally {
        if (componentActive) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setPasswordRecovery(true);
          setAuthLoading(false);
          return;
        }

        if (!session) {
          setRole(null);
          setProfile(null);
          setAuthLoading(false);
        }
      }
    );

    return () => {
      componentActive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading || !role) {
      return;
    }

    let componentActive = true;

    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          category,
          price,
          description,
          image_url,
          preparation_time,
          minimum_order,
          stock_quantity,
          low_stock_limit,
          is_active,
          is_archived,
          is_featured,
          featured_order,
          is_customizable,
          product_options (
            option_name
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar produtos:",
          error
        );

        setToast(
          "Não foi possível carregar os produtos."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        return;
      }

      const productRows = (data || []) as ProductRow[];

      setProducts(
        productRows.map(mapProduct)
      );
    }

    loadProducts();

    return () => {
      componentActive = false;
    };
  }, [authLoading, role]);

  useEffect(() => {
    if (authLoading || role !== "admin") {
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

        setToast(
          "Não foi possível carregar os pedidos."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        return;
      }

      const orderRows =
        (data || []) as AdminOrderRow[];

      setAppOrders(
        orderRows.map(mapAdminOrder)
      );
    }

    loadAdminOrders();

    return () => {
      componentActive = false;
    };
  }, [authLoading, role]);

  useEffect(() => {
    if (authLoading || !role) {
      return;
    }

    let componentActive = true;

    async function loadQuotes() {
      const {
        data,
        error: quotesError,
      } = await supabase
        .from("quotes")
        .select(`
          id,
          quote_number,
          order_id,
          customer_name,
          title,
          details,
          desired_date,
          desired_time,
          quoted_amount,
          admin_message,
          reference_image_url,
          status,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!componentActive) {
        return;
      }

      if (quotesError) {
        console.error(
          "Erro ao carregar orçamentos:",
          quotesError
        );

        setToast(
          "Não foi possível carregar os orçamentos."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        return;
      }

      const quoteRows =
        (data || []) as QuoteRow[];

      const mappedQuotes = await Promise.all(
        quoteRows.map(async row => {
          const quote = mapQuote(row);

          if (!quote.imagePath) {
            return quote;
          }

          const {
            data: signedUrlData,
            error: signedUrlError,
          } = await supabase.storage
            .from("quote-images")
            .createSignedUrl(
              quote.imagePath,
              60 * 60
            );

          if (signedUrlError) {
            console.error(
              `Erro ao carregar a imagem do orçamento ${quote.id}:`,
              signedUrlError
            );

            return quote;
          }

          return {
            ...quote,
            image:
              signedUrlData.signedUrl,
          };
        })
      );

      if (!componentActive) {
        return;
      }

      setQuotes(mappedQuotes);
    }

    loadQuotes();

    return () => {
      componentActive = false;
    };
  }, [authLoading, role]);

  useEffect(() => {
    if (authLoading || !role) {
      const timer = window.setTimeout(() => {
        setNotifications([]);
      }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }

    let componentActive = true;

    async function loadNotifications() {
      setNotificationsLoading(true);

      const {
        data,
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .select(`
          id,
          title,
          message,
          type,
          related_entity_type,
          related_entity_id,
          is_read,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        })
        .limit(30);

      if (!componentActive) {
        return;
      }

      if (notificationsError) {
        console.error(
          "Erro ao carregar notificações:",
          notificationsError
        );

        setNotifications([]);
        setNotificationsLoading(false);
        return;
      }

      const mappedNotifications: AppNotification[] =
        (data || []).map(notification => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          relatedEntityType:
            notification.related_entity_type,
          relatedEntityId:
            notification.related_entity_id,
          isRead: notification.is_read,
          createdAt: notification.created_at,
        }));

      setNotifications(mappedNotifications);
      setNotificationsLoading(false);
    }

    loadNotifications();

    return () => {
      componentActive = false;
    };
  }, [authLoading, role]);

  useEffect(() => {
    if (authLoading || !role) {
      return;
    }

    let componentActive = true;

    const channel = supabase.channel(
      `notifications-${crypto.randomUUID()}`
    );

    async function subscribeToNotifications() {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (
        !componentActive ||
        userError ||
        !userData.user
      ) {
        if (userError) {
          console.error(
            "Erro ao identificar usuário das notificações:",
            userError
          );
        }

        return;
      }

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userData.user.id}`,
          },
          payload => {
            const row = payload.new as {
              id: string;
              title: string;
              message: string;
              type: string;
              related_entity_type: string | null;
              related_entity_id: string | null;
              is_read: boolean;
              created_at: string;
            };

            const newNotification: AppNotification = {
              id: row.id,
              title: row.title,
              message: row.message,
              type: row.type,
              relatedEntityType:
                row.related_entity_type,
              relatedEntityId:
                row.related_entity_id,
              isRead: row.is_read,
              createdAt: row.created_at,
            };

            setNotifications(current => {
              const notificationAlreadyExists =
                current.some(
                  notification =>
                    notification.id ===
                    newNotification.id
                );

              if (notificationAlreadyExists) {
                return current;
              }

              return [
                newNotification,
                ...current,
              ].slice(0, 30);
            });
          }
        )
        .subscribe(status => {
          if (status === "CHANNEL_ERROR") {
            console.error(
              "Erro no canal de notificações em tempo real."
            );
          }
        });
    }

    subscribeToNotifications();

    return () => {
      componentActive = false;
      supabase.removeChannel(channel);
    };
  }, [authLoading, role]);

  useEffect(() => {
    if (
      authLoading ||
      role !== "admin" ||
      screen !== "Relatórios"
    ) {
      return;
    }

    let componentActive = true;

    async function loadReviews() {
      setReviewsLoading(true);

      const {
        data,
        error: reviewsError,
      } = await supabase
        .from("reviews")
        .select(`
          id,
          order_id,
          user_id,
          rating,
          comment,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (!componentActive) {
        return;
      }

      if (reviewsError) {
        console.error(
          "Erro ao carregar avaliações:",
          reviewsError
        );

        setReviews([]);
        setReviewsLoading(false);
        return;
      }

      const mappedReviews: AppReview[] =
        (data || []).map(review => ({
          id: review.id,
          orderId: review.order_id,
          userId: review.user_id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.created_at,
        }));

      setReviews(mappedReviews);
      setReviewsLoading(false);
    }

    loadReviews();

    return () => {
      componentActive = false;
    };
  }, [
    authLoading,
    role,
    screen,
  ]);

  useEffect(() => {
    let componentActive = true;

    async function loadOrderClients() {
      if (!modal || role !== "admin") {
        return;
      }

      setOrderClientsLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          created_at
        `)
        .eq("role", "client")
        .order("full_name", {
          ascending: true,
        });

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar clientes do pedido:",
          error
        );

        setToast(
          "Não foi possível carregar os clientes."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        setOrderClientsLoading(false);
        return;
      }

      setOrderClients(
        (data || []) as ClientProfileRow[]
      );

      setOrderClientsLoading(false);
    }

    loadOrderClients();

    return () => {
      componentActive = false;
    };
  }, [modal, role]);

  useEffect(() => {
  let componentActive = true;

  async function loadStoreSettings() {
      if (
        authLoading ||
        !role
      ) {
        return;
      }

      setStoreSettingsLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("store_settings")
        .select(`
          id,
          store_name,
          description,
          cnpj,
          contact_email,
          whatsapp,
          instagram,
          address,
          city,
          state,
          zip_code,
          opening_time,
          closing_time,
          business_days,
          business_weekdays,
          minimum_order_value,
          delivery_fee,
          accepts_orders,
          created_at,
          updated_at
        `)
        .eq("id", 1)
        .single();

      if (!componentActive) {
        return;
      }

      if (error) {
        console.error(
          "Erro ao carregar configurações:",
          error
        );

        setStoreSettings(null);
        setStoreSettingsLoading(false);

        setToast(
          "Não foi possível carregar as configurações."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        return;
      }

      setStoreSettings(
        data as StoreSettings
      );

      setStoreSettingsLoading(false);
    }

    loadStoreSettings();

    return () => {
      componentActive = false;
    };
  }, [authLoading, role]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery =
      normalizeSearch(query);

    if (!normalizedQuery) {
      return appOrders;
    }

    return appOrders.filter(order => {
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
        order.deliveryDateRaw || "",
        fulfillmentLabel,
        order.deliveryAddress || "",
        order.request || "",
      ].join(" ");

      return normalizeSearch(
        searchableContent
      ).includes(normalizedQuery);
    });
  }, [query, appOrders]);

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
            updated_at: new Date().toISOString(),
          })
          .eq("id", databaseId);

        if (statusError) {
          console.error(
            "Erro ao atualizar status:",
            statusError
          );

          setToast(
            "Não foi possível atualizar o status."
          );

          setTimeout(() => {
            setToast("");
          }, 2800);

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

        setToast(
          "Status do pedido atualizado!"
        );

        setTimeout(() => {
          setToast("");
        }, 2000);
      } catch (error) {
        console.error(
          "Erro inesperado ao atualizar status:",
          error
        );

        setToast(
          "Ocorreu um erro ao atualizar o status."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);
      } finally {
        setUpdatingOrderId(null);
      }
    }

    async function resolveOrderRequest(
      order: AppOrder,
      decision: "approved" | "rejected"
    ) {
      setResolvingRequestId(order.databaseId);

      try {
        const isPaidCancellationApproval =
          decision === "approved" &&
          order.requestType === "cancellation" &&
          [
            "paid",
            "refund_pending",
            "refunded",
          ].includes(order.paymentStatus);

        if (isPaidCancellationApproval) {
          const {
            data: refundData,
            error: refundError,
          } = await supabase.functions.invoke(
            "refund-stripe-payment",
            {
              body: {
                orderId: order.databaseId,
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
                  await errorContext.clone().json();

                console.error(
                  "Resposta da função de reembolso:",
                  errorBody
                );

                if (errorBody?.error) {
                  errorMessage = errorBody.error;
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

            setToast(errorMessage);

            setTimeout(() => {
              setToast("");
            }, 2800);

            return;
          }

          if (!refundData?.success) {
            setToast(
              refundData?.error ||
                "Não foi possível solicitar o reembolso."
            );

            setTimeout(() => {
              setToast("");
            }, 2800);

            return;
          }
        } else {
          const {
            error: resolveError,
          } = await supabase.rpc(
            "resolve_order_request",
            {
              p_order_id: order.databaseId,
              p_decision: decision,
            }
          );

          if (resolveError) {
            console.error(
              "Erro ao responder solicitação:",
              resolveError
            );

            setToast(
              "Não foi possível responder à solicitação."
            );

            setTimeout(() => {
              setToast("");
            }, 2800);

            return;
          }
        }

        setAppOrders(currentOrders =>
          currentOrders.map(currentOrder => {
            if (
              currentOrder.databaseId !==
              order.databaseId
            ) {
              return currentOrder;
            }

            if (decision === "rejected") {
              return {
                ...currentOrder,
                request: undefined,
                requestStatus: "rejected",
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
                requestStatus: "approved",
              };
            }

            return {
              ...currentOrder,

              date: currentOrder.requestedDate
                ? formatDeliveryDate(
                    currentOrder.requestedDate
                  )
                : currentOrder.date,

              time:
                currentOrder.requestedTime?.slice(
                  0,
                  5
                ) || currentOrder.time,

              request: undefined,
              requestStatus: "approved",
            };
          })
        );

        if (isPaidCancellationApproval) {
          setToast(
            "Cancelamento aprovado e reembolso solicitado!"
          );
        } else {
          setToast(
            decision === "approved"
              ? "Solicitação aprovada!"
              : "Solicitação rejeitada!"
          );
        }

        setTimeout(() => {
          setToast("");
        }, 2800);
      } catch (error) {
        console.error(
          "Erro inesperado ao responder solicitação:",
          error
        );

        setToast(
          "Ocorreu um erro ao responder à solicitação."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);
      } finally {
        setResolvingRequestId(null);
      }
    }

  async function handleAdminQuoteResponse(
    quote: Quote,
    value: string,
    message: string
  ) {
    const amount = databasePrice(value);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setToast(
        "Informe um valor válido para o orçamento."
      );

      setTimeout(() => {
        setToast("");
      }, 2800);

      return false;
    }

    setUpdatingQuoteId(quote.databaseId);

    try {
      const {
        error: responseError,
      } = await supabase.rpc(
        "admin_respond_quote",
        {
          p_quote_id: quote.databaseId,
          p_amount: amount,
          p_message: message || null,
        }
      );

      if (responseError) {
        console.error(
          "Erro ao responder orçamento:",
          responseError
        );

        setToast(
          "Não foi possível enviar o orçamento."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        return false;
      }

      setQuotes(currentQuotes =>
        currentQuotes.map(currentQuote =>
          currentQuote.databaseId ===
          quote.databaseId
            ? {
                ...currentQuote,
                value: money(amount),
                status: "Aguardando cliente",
                statusCode:
                  "awaiting_customer",
                adminMessage: message,
              }
            : currentQuote
        )
      );

      setToast(
        "Orçamento enviado ao cliente!"
      );

      setTimeout(() => {
        setToast("");
      }, 2200);

      return true;
    } catch (error) {
      console.error(
        "Erro inesperado ao responder orçamento:",
        error
      );

      setToast(
        "Ocorreu um erro ao enviar o orçamento."
      );

      setTimeout(() => {
        setToast("");
      }, 2800);

      return false;
    } finally {
      setUpdatingQuoteId(null);
    }
  }

  async function handleClientQuoteResponse(
    quoteId: string,
    decision: "approved" | "rejected"
  ) {
    try {
      const {
        error: responseError,
      } = await supabase.rpc(
        "respond_to_quote",
        {
          p_quote_id: quoteId,
          p_decision: decision,
        }
      );

      if (responseError) {
        console.error(
          "Erro ao responder orçamento:",
          responseError
        );

        return false;
      }

      setQuotes(currentQuotes =>
        currentQuotes.map(quote =>
          quote.databaseId === quoteId
            ? {
                ...quote,
                status:
                  decision === "approved"
                    ? "Aprovado"
                    : "Recusado",
                statusCode: decision,
              }
            : quote
        )
      );

      return true;
    } catch (error) {
      console.error(
        "Erro inesperado ao responder orçamento:",
        error
      );

      return false;
    }
  }

  async function saveOrder(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

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
      formData.get("status") || "confirmed"
    );

    const fulfillmentType =
      String(
        formData.get("fulfillmentType") ||
          "pickup"
      ) as "delivery" | "pickup";

    const deliveryAddress = String(
      formData.get("deliveryAddress") || ""
    ).trim();

    const notes = String(
      formData.get("notes") || ""
    ).trim();

    const selectedClient =
      orderClients.find(
        client => client.id === clientId
      );

    const selectedProduct =
      products.find(
        product =>
          String(product.id) === productId
      );

    if (!selectedClient) {
      setToast("Selecione um cliente.");
      setTimeout(() => setToast(""), 2800);
      return;
    }

    if (!selectedProduct) {
      setToast("Selecione um produto.");
      setTimeout(() => setToast(""), 2800);
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setToast("Informe uma quantidade válida.");
      setTimeout(() => setToast(""), 2800);
      return;
    }

    if (quantity > selectedProduct.stock) {
      setToast(
        `Estoque disponível: ${selectedProduct.stock}.`
      );

      setTimeout(() => setToast(""), 2800);
      return;
    }

    if (
      fulfillmentType === "delivery" &&
      deliveryAddress.length < 5
    ) {
      setToast(
        "Informe o endereço para entrega."
      );

      setTimeout(() => {
        setToast("");
      }, 2800);

      return;
    }

    setSavingOrder(true);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "create_admin_order",
        {
          p_client_id: clientId,

          p_items: [
            {
              product_id: productId,
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
            fulfillmentType === "delivery"
              ? deliveryAddress
              : null,
        }
      );

      if (error) {
        console.error(
          "Erro ao criar pedido administrativo:",
          error
        );

        setToast(
          error.message ||
            "Não foi possível criar o pedido."
        );

        setTimeout(() => {
          setToast("");
        }, 3200);

        return;
      }

      const result = data as {
        order_id: string;
        order_number: number;
        subtotal_amount: number;
        delivery_fee: number;
        total_amount: number;

        fulfillment_type:
          | "delivery"
          | "pickup";

        delivery_address:
          | string
          | null;

        status: string;
      };

      const newOrder: AppOrder = {
        databaseId: result.order_id,
        userId: selectedClient.id,
        id: `#${result.order_number}`,
        client: selectedClient.full_name,

        initials: getInitials(
          selectedClient.full_name
        ),

        item:
          `${quantity}× ${selectedProduct.name}`,

        time:
          deliveryTime
            ? deliveryTime.slice(0, 5)
            : "A combinar",

        date:
          deliveryDate
            ? formatDeliveryDate(
                deliveryDate
              )
            : "Data a combinar",

        value: money(
          Number(result.total_amount)
        ),

        subtotalAmount:
          Number(result.subtotal_amount),

        deliveryFeeAmount:
          Number(result.delivery_fee),

        fulfillmentType:
          result.fulfillment_type,

        deliveryAddress:
          result.delivery_address,

        status:
          orderStatusLabel(
            result.status
          ),

        statusCode: result.status,
        paymentStatus: "pending",
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

      setAppOrders(currentOrders => [
        newOrder,
        ...currentOrders,
      ]);

      setProducts(currentProducts =>
        currentProducts.map(product =>
          String(product.id) === productId
            ? {
                ...product,
                stock:
                  product.stock - quantity,
              }
            : product
        )
      );

      form.reset();

      setAdminFulfillmentType(
        "pickup"
      );

      setModal(false);

      setToast(
        `Pedido #${result.order_number} cadastrado com sucesso!`
      );

      setTimeout(() => {
        setToast("");
      }, 2800);
    } catch (unexpectedError) {
      console.error(
        "Erro inesperado ao criar pedido:",
        unexpectedError
      );

      setToast(
        "Ocorreu um erro ao criar o pedido."
      );

      setTimeout(() => {
        setToast("");
      }, 2800);
    } finally {
      setSavingOrder(false);
    }
  }

  async function saveStoreSettings(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const businessWeekdays = formData
      .getAll("businessWeekdays")
      .map(value => Number(value))
      .filter(
        value =>
          Number.isInteger(value) &&
          value >= 0 &&
          value <= 6
      );

    if (businessWeekdays.length === 0) {
      setToast(
        "Selecione pelo menos um dia de funcionamento."
      );

      setTimeout(() => {
        setToast("");
      }, 2800);

      return;
    }

    const selectedDayLabels =
      businessWeekdays.map(day => {
        const option = weekdayOptions.find(
          item => item.value === day
        );

        return option?.label || "";
      });

    const businessDaysLabel =
      selectedDayLabels.join(", ");

    const minimumOrderValue = Number(
      String(
        formData.get("minimumOrderValue") || "0"
      ).replace(",", ".")
    );

    const deliveryFee = Number(
      String(
        formData.get("deliveryFee") || "0"
      ).replace(",", ".")
    );

    setSavingStoreSettings(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("store_settings")
        .update({
          store_name: String(
            formData.get("storeName") || ""
          ).trim(),

          description:
            String(
              formData.get("description") || ""
            ).trim() || null,

          cnpj:
            String(
              formData.get("cnpj") || ""
            ).trim() || null,

          contact_email:
            String(
              formData.get("contactEmail") || ""
            ).trim() || null,

          whatsapp:
            String(
              formData.get("whatsapp") || ""
            ).trim() || null,

          instagram:
            String(
              formData.get("instagram") || ""
            ).trim() || null,

          address:
            String(
              formData.get("address") || ""
            ).trim() || null,

          city:
            String(
              formData.get("city") || ""
            ).trim() || null,

          state:
            String(
              formData.get("state") || ""
            ).trim() || null,

          zip_code:
            String(
              formData.get("zipCode") || ""
            ).trim() || null,

          opening_time:
            String(
              formData.get("openingTime") || ""
            ) || null,

          closing_time:
            String(
              formData.get("closingTime") || ""
            ) || null,

          business_days: businessDaysLabel,
          business_weekdays: businessWeekdays,

          minimum_order_value:
            Number.isFinite(minimumOrderValue)
              ? minimumOrderValue
              : 0,

          delivery_fee:
            Number.isFinite(deliveryFee)
              ? deliveryFee
              : 0,

          accepts_orders:
            formData.get("acceptsOrders") === "on",

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", 1)
        .select()
        .single();

      if (error) {
        console.error(
          "Erro ao salvar configurações:",
          error
        );

        setToast(
          "Não foi possível salvar as configurações."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        return;
      }

      setStoreSettings(
        data as StoreSettings
      );

      setToast(
        "Configurações salvas com sucesso!"
      );

      setTimeout(() => {
        setToast("");
      }, 2400);
    } catch (error) {
      console.error(
        "Erro inesperado ao salvar configurações:",
        error
      );

      setToast(
        "Ocorreu um erro ao salvar as configurações."
      );

      setTimeout(() => {
        setToast("");
      }, 2800);
    } finally {
      setSavingStoreSettings(false);
    }
  }

  async function handleLogout() {
  
    sessionStorage.removeItem(
      "fribolos-client-section"
    );

    const { error: logoutError } =
      await supabase.auth.signOut();

    if (logoutError) {
      console.error(
        "Erro ao sair da conta:",
        logoutError
      );

      setToast(
        "Não foi possível sair da conta. Tente novamente."
      );

      setTimeout(() => {
        setToast("");
      }, 2800);

      return;
    }

    setRole(null);
    setProfile(null);
    setScreen("Visão geral");
  }

  async function handleStockChange(
    productId: Product["id"],
    newStock: number
  ) {
    const normalizedStock =
      Math.max(0, Math.floor(newStock));

    try {
      const {
        error: stockError,
      } = await supabase
        .from("products")
        .update({
          stock_quantity: normalizedStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (stockError) {
        console.error(
          "Erro ao atualizar estoque:",
          stockError
        );

        setToast(
          "Não foi possível atualizar o estoque."
        );

        setTimeout(() => {
          setToast("");
        }, 2800);

        return;
      }

      setProducts(currentProducts =>
        currentProducts.map(product =>
          product.id === productId
            ? {
                ...product,
                stock: normalizedStock,
              }
            : product
        )
      );

      setToast("Estoque atualizado!");

      setTimeout(() => {
        setToast("");
      }, 1800);
    } catch (error) {
      console.error(
        "Erro inesperado ao atualizar estoque:",
        error
      );

      setToast(
        "Ocorreu um erro ao atualizar o estoque."
      );

      setTimeout(() => {
        setToast("");
      }, 2800);
    }
  }

  async function handleMarkNotificationsAsRead() {
    const unreadIds = notifications
      .filter(notification => !notification.isRead)
      .map(notification => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    const { error: updateError } =
      await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .in("id", unreadIds);

    if (updateError) {
      console.error(
        "Erro ao marcar notificações como lidas:",
        updateError
      );

      return;
    }

    setNotifications(current =>
      current.map(notification => ({
        ...notification,
        isRead: true,
      }))
    );
  }

  const unreadNotificationsCount =
  notifications.filter(
    notification => !notification.isRead
  ).length;

  const currentDate = new Intl.DateTimeFormat(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }
  )
    .format(new Date())
    .toLocaleUpperCase("pt-BR");
  /*
   * Enquanto o Supabase verifica a sessão,
   * não mostra o login nem os painéis.
   */

  if (passwordRecovery) {
    return (
      <ResetPassword
        onComplete={() => {
          setPasswordRecovery(false);
          setRole(null);
          setProfile(null);
        }}
      />
    );
  }

  if (authLoading) {
    return (
      <main className="account-created">
        <section>
          <span>♨</span>

          <p className="eyebrow">
            FRIBOLOS
          </p>

          <h1>Carregando sua conta...</h1>

          <p>
            Estamos verificando sua sessão com
            segurança.
          </p>
        </section>
      </main>
    );
  }

  /*
   * Sem usuário autenticado, mostra o login.
   */
  if (!role) {
    return (
      <Login
        onLogin={userProfile => {
          setProfile(userProfile);
          setRole(userProfile.role);
        }}
      />
    );
  }

  /*
   * Usuário com role client.
   */
  if (role === "client" && profile) {
    return (
      <>
        <ClientPortal
          userProfile={profile}
          onProfileChange={setProfile}

          products={products.filter(
            product => !product.archived
          )}

          quotes={quotes}

          storeSettings={storeSettings}

          storeSettingsLoading={
            storeSettingsLoading
          }

          onQuote={
            handleClientQuoteResponse
          }

          unreadNotificationsCount={
            unreadNotificationsCount
          }

          onOpenNotifications={() =>
            setNotificationsOpen(true)
          }

          onLogout={handleLogout}
        />

        {notificationsOpen && (
          <NotificationPanel
            items={notifications}
            loading={notificationsLoading}
            onClose={() =>
              setNotificationsOpen(false)
            }
            onRead={handleMarkNotificationsAsRead}
          />
        )}
      </>
    );
  }

  /*
   * Usuário com role admin.
   */
  return (
    <main className="app-shell">
      <aside
        className={`sidebar ${
          mobileNav ? "open" : ""
        }`}
      >
        <button
          className="close-menu"
          onClick={() => setMobileNav(false)}
          aria-label="Fechar menu"
        >
          ×
        </button>

        <div className="brand">
          <span className="cake">♨</span>

          <strong>
            {storeSettings?.store_name || "FriBolos"}
          </strong>
        </div>

        <div className="ornament">
          <span />
          ✤
          <span />
        </div>

        <nav>
          {nav.map(item => (
            <button
              key={item.label}
              className={
                screen === item.label
                  ? "active"
                  : ""
              }
              onClick={() => {
                setScreen(item.label);
                setMobileNav(false);
              }}
            >
              <b>{item.icon}</b>
              {item.label}
            </button>
          ))}
        </nav>

        <button
          className="new-order side"
          onClick={() => setModal(true)}
        >
          <span>＋</span>
          Novo pedido
        </button>

        <div className="side-art" />
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button
            className="menu"
            onClick={() => setMobileNav(true)}
            aria-label="Abrir menu"
          >
            ☰
          </button>

          <div>
            <p className="eyebrow">
              {currentDate}
            </p>

            <h1>
              {screen === "Visão geral"
                ? `Bom dia, ${getFirstName(
                  profile?.full_name || "Administrador"
                )}`
                : screen}
            </h1>

            <p>
              {screen === "Visão geral"
                ? "Aqui está o resumo da sua confeitaria hoje."
                : `Gerencie ${screen.toLowerCase()} da sua confeitaria.`}
            </p>
          </div>

          <div className="header-actions">
            <label className="search">
              <span>⌕</span>

              <input
                value={query}
                onChange={e =>
                  setQuery(e.target.value)
                }
                placeholder="Buscar..."
              />
            </label>

            <button
              type="button"
              className="bell"
              aria-label={`Abrir notificações. ${unreadNotificationsCount} não lidas`}
              onClick={() =>
                setNotificationsOpen(value => !value)
              }
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

            <div className="avatar">
              {getInitials(
                profile?.full_name || "Administrador"
              )}
            </div>

            <button
              className="user user-button"
              onClick={handleLogout}
              title="Sair da conta"
            >
              <strong>
                {profile?.full_name || "Administrador"}
              </strong>

              <small>
                Administradora • Sair
              </small>
            </button>
          </div>
        </header>

        {screen === "Visão geral" && (
          <Dashboard
            setScreen={setScreen}
            openModal={() => setModal(true)}
            orders={appOrders}
          />
        )}

        {screen === "Pedidos" && (
          <Orders
            orders={filteredOrders}
            openModal={() => setModal(true)}
            onStatus={handleOrderStatusChange}
            updatingOrderId={updatingOrderId}
            onResolveRequest={resolveOrderRequest}
            resolvingRequestId={resolvingRequestId}
          />
        )}

        {screen === "Orçamentos" && (
          <AdminQuotes
            quotes={quotes}
            onUpdate={handleAdminQuoteResponse}
            updatingQuoteId={updatingQuoteId}
          />
        )}

        {screen === "Produção" && (
          <Production
            orders={appOrders}
            onStatus={handleOrderStatusChange}
            updatingOrderId={updatingOrderId}
          />
        )}

        {screen === "Cardápio" && (
          <Catalog
            products={products}
            onChange={setProducts}
            onToast={message => {
              setToast(message);

              setTimeout(() => {
                setToast("");
              }, 2800);
            }}
          />
        )}

        {screen === "Estoque" && (
          <Inventory
            products={products.filter(
              product => !product.archived
            )}
            onStock={handleStockChange}
          />
        )}

        {screen === "Clientes" && (
          <Clients orders={appOrders} />
        )}

        {screen === "Financeiro" && (
          <Finance />
        )}

        {screen === "Relatórios" && (
          <Reports
            reviews={reviews}
            orders={appOrders}
            loading={reviewsLoading}
          />
        )}

        {screen === "Configurações" && (
          <Settings
            settings={storeSettings}
            loading={storeSettingsLoading}
            saving={savingStoreSettings}
            onSave={saveStoreSettings}
          />
        )}
      </section>

      {notificationsOpen && (
        <NotificationPanel
          items={notifications}
          loading={notificationsLoading}
          onClose={() =>
            setNotificationsOpen(false)
          }
          onRead={handleMarkNotificationsAsRead}
        />
      )}

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={event => {
            if (event.currentTarget === event.target) {
              setAdminFulfillmentType("pickup");
              setModal(false);
            }
          }}
        >
          <form
            className="modal"
            onSubmit={saveOrder}
          >
            <div className="modal-title">
              <div>
                <p>NOVO PEDIDO</p>
                <h2>Adicionar encomenda</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAdminFulfillmentType("pickup");
                  setModal(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label className="wide">
                Cliente

                <select
                  required
                  name="clientId"
                  defaultValue=""
                  disabled={orderClientsLoading}
                >
                  <option value="" disabled>
                    {orderClientsLoading
                      ? "Carregando clientes..."
                      : "Selecione um cliente"}
                  </option>

                  {orderClients.map(client => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.full_name}
                      {client.phone
                        ? ` — ${client.phone}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="wide">
                Produto

                <select
                  required
                  name="productId"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione um produto
                  </option>

                  {products
                    .filter(
                      product =>
                        product.active &&
                        !product.archived
                    )
                    .map(product => (
                      <option
                        key={product.id}
                        value={String(product.id)}
                        disabled={product.stock <= 0}
                      >
                        {product.name} —{" "}
                        {product.price} — estoque:{" "}
                        {product.stock}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Quantidade

                <input
                  required
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  defaultValue="1"
                />
              </label>

              <label>
                Status inicial

                <select
                  required
                  name="status"
                  defaultValue="confirmed"
                >
                  <option value="pending">
                    Aguardando
                  </option>

                  <option value="confirmed">
                    Confirmado
                  </option>

                  <option value="in_production">
                    Em produção
                  </option>
                </select>
              </label>

              <label>
                Forma de recebimento

                <select
                  required
                  name="fulfillmentType"
                  value={adminFulfillmentType}
                  onChange={event =>
                    setAdminFulfillmentType(
                      event.target.value as
                        | "delivery"
                        | "pickup"
                    )
                  }
                >
                  <option value="pickup">
                    Retirada no local
                  </option>

                  <option value="delivery">
                    Entrega
                    {Number(
                      storeSettings?.delivery_fee || 0
                    ) > 0
                      ? ` — ${money(
                          Number(
                            storeSettings?.delivery_fee
                          )
                        )}`
                      : ""}
                  </option>
                </select>
              </label>

              {adminFulfillmentType ===
                "delivery" && (
                <label className="wide">
                  Endereço para entrega

                  <input
                    required
                    name="deliveryAddress"
                    placeholder="Rua, número, bairro e complemento"
                  />
                </label>
              )}
              
              <label>
                Data da entrega

                <input
                  name="deliveryDate"
                  type="date"
                />
              </label>

              <label>
                Horário

                <input
                  name="deliveryTime"
                  type="time"
                />
              </label>

              <label className="wide">
                Observações

                <textarea
                  name="notes"
                  placeholder="Detalhes, decoração, sabor, restrições..."
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setAdminFulfillmentType("pickup");
                  setModal(false);
                }}
              >
                Cancelar
              </button>

              <button
                className="primary"
                disabled={
                  savingOrder ||
                  orderClientsLoading
                }
              >
                {savingOrder
                  ? "Salvando pedido..."
                  : "Salvar pedido"}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="toast">
          ✓ {toast}
        </div>
      )}
    </main>
  );
}
