"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  AppNotification,
  ClientSection,
  Screen,
} from "./types";

import { ResetPassword } from "./components/auth/reset-password";
import { Login } from "./components/auth/login";
import { NotificationPanel } from "./components/notification-panel";
import { ClientPortal } from "./components/client/client-portal";
import { useStoreSettings } from "./hooks/use-store-settings";
import { useNotifications } from "./hooks/use-notifications";
import { useAdminReviews } from "./hooks/use-admin-reviews";
import { useOrderClients } from "./hooks/use-order-clients";
import { useQuotes } from "./hooks/use-quotes";
import { useProducts } from "./hooks/use-products";
import { useAdminOrders } from "./hooks/use-admin-orders";
import { useAuth } from "./hooks/use-auth";
import { useAdminOrderForm } from "./hooks/use-admin-order-form";
import { AdminOrderModal } from "./components/admin/admin-order-modal";
import { AdminSidebar } from "./components/admin/admin-sidebar";
import { AdminTopbar } from "./components/admin/admin-topbar";
import { AdminContent } from "./components/admin/admin-content";
import {
  PublicSite,
} from "./components/public/public-site";

export default function Home() {
  const [screen, setScreen] =
    useState<Screen>("Visão geral");

  const [
    showPublicLogin,
    setShowPublicLogin,
  ] = useState(false);

  const [
    clientNavigationRequest,
    setClientNavigationRequest,
  ] = useState<{
    section: ClientSection;
    id: number;
  } | null>(null);

  useEffect(() => {
    const searchParams =
      new URLSearchParams(
        window.location.search
      );

    const shouldOpenLogin =
      searchParams.get("entrar") === "1" ||
      searchParams.get("access") ===
        "admin";

    if (!shouldOpenLogin) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setShowPublicLogin(true);
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const savedScreen =
      sessionStorage.getItem(
        "fribolos-admin-screen"
      );

    const validScreens: Screen[] = [
      "Visão geral",
      "Pedidos",
      "Orçamentos",
      "Produção",
      "Cardápio",
      "Estoque",
      "Clientes",
      "Financeiro",
      "Relatórios",
      "Configurações",
    ];

    if (
      savedScreen &&
      validScreens.includes(
        savedScreen as Screen
      )
    ) {
      const timer =
        window.setTimeout(() => {
          setScreen(
            savedScreen as Screen
          );
        }, 0);

      return () => {
        window.clearTimeout(timer);
      };
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      "fribolos-admin-screen",
      screen
    );
  }, [screen]);

  const [modal, setModal] =
    useState(false);

  const [toast, setToast] =
    useState("");

  const {
    role,
    profile,
    setProfile,
    authLoading,
    passwordRecovery,
    handleLogin,
    handleLogout,
    completePasswordRecovery,
  } = useAuth({
    setToast,

  onLogoutSuccess: () => {
    setScreen("Visão geral");
    setShowPublicLogin(false);

    window.history.replaceState(
      null,
      "",
      "/"
    );
  },
  });

  const [mobileNav, setMobileNav] =
    useState(false);

  const {
    appOrders,
    setAppOrders,

    query,
    setQuery,
    filteredOrders,

    updatingOrderId,
    resolvingRequestId,

    handleOrderStatusChange,
    resolveOrderRequest,
  } = useAdminOrders({
    authLoading,
    role,
    setToast,
  });

  const {
    products,
    setProducts,
    handleStockChange,
  } = useProducts({
    authLoading,
    role,
    setToast,
  });

  const {
    quotes,
    updatingQuoteId,
    handleAdminQuoteResponse,
    handleClientQuoteResponse,
  } = useQuotes({
    authLoading,
    role,
    setToast,
  });

  const {
    orderClients,
    orderClientsLoading,
  } = useOrderClients({
    modalOpen: modal,
    role,
    setToast,
  });

  const {
    savingOrder,
    adminFulfillmentType,
    setAdminFulfillmentType,
    saveOrder,
  } = useAdminOrderForm({
    products,
    setProducts,
    orderClients,
    setAppOrders,
    setToast,

    onClose: () => {
      setModal(false);
    },
  });

  const {
    reviews,
    reviewsLoading,
  } = useAdminReviews({
    authLoading,
    role,
    screen,
  });

  const {
    notificationsOpen,
    setNotificationsOpen,
    notifications,
    notificationsLoading,
    unreadNotificationsCount,
    handleMarkNotificationsAsRead,
  } = useNotifications({
    authLoading,
    role,
  });

  const {
    storeSettings,
    storeSettingsLoading,
    savingStoreSettings,
    saveStoreSettings,
  } = useStoreSettings({
    authLoading,
    role,
    setToast,
  });

  function notificationTarget(
    notification: AppNotification
  ) {
    return (
      notification.relatedEntityType ||
      notification.type ||
      "general"
    ).toLowerCase();
  }

  function handleClientNotificationSelect(
    notification: AppNotification
  ) {
    const target =
      notificationTarget(notification);

    const sections:
      Record<string, ClientSection> = {
        order: "pedidos",
        orders: "pedidos",

        quote: "orcamentos",
        quotes: "orcamentos",

        payment: "pagamento",
        payments: "pagamento",

        review: "avaliacao",
        reviews: "avaliacao",

        account: "perfil",
        profile: "perfil",

        product: "catalogo",
        products: "catalogo",
        stock: "catalogo",

        general: "catalogo",
      };

    setClientNavigationRequest({
      section:
        sections[target] ||
        "catalogo",

      id: Date.now(),
    });
  }

  function handleAdminNotificationSelect(
    notification: AppNotification
  ) {
    const target =
      notificationTarget(notification);

    const screens:
      Record<string, Screen> = {
        order: "Pedidos",
        orders: "Pedidos",

        quote: "Orçamentos",
        quotes: "Orçamentos",

        payment: "Financeiro",
        payments: "Financeiro",

        product: "Cardápio",
        products: "Cardápio",

        stock: "Estoque",

        review: "Visão geral",
        reviews: "Visão geral",

        account: "Clientes",
        profile: "Clientes",

        general: "Visão geral",
      };

    setScreen(
      screens[target] ||
      "Visão geral"
    );
  }

  function openPublicLogin() {
    window.history.replaceState(
      null,
      "",
      "/?entrar=1"
    );

    setShowPublicLogin(true);
  }

  function closePublicLogin() {
    window.history.replaceState(
      null,
      "",
      "/"
    );

    setShowPublicLogin(false);
  }

  /*
   * Enquanto o Supabase verifica a sessão,
   * não mostra o login nem os painéis.
   */

  if (passwordRecovery) {
    return (
      <ResetPassword
        onComplete={
          completePasswordRecovery
        }
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
    if (showPublicLogin) {
      return (
        <div className="public-login-view">
          <button
            type="button"
            className="public-login-back"
            onClick={closePublicLogin}
          >
            <span>←</span>
            Voltar para o início
          </button>

          <Login
            onLogin={handleLogin}
          />
        </div>
      );
    }

    return (
      <PublicSite
        onOpenLogin={openPublicLogin}
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

          navigationRequest={
            clientNavigationRequest
          }

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

          onLogout={async () => {
            sessionStorage.removeItem(
              "fribolos-client-section"
            );

            setClientNavigationRequest(null);

            await handleLogout();
          }}
        />

        {notificationsOpen && (
          <NotificationPanel
            items={notifications}
            loading={notificationsLoading}
            onClose={() =>
              setNotificationsOpen(false)
            }
            onRead={handleMarkNotificationsAsRead}
            onSelect={
              handleClientNotificationSelect
            }
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
      <AdminSidebar
        screen={screen}
        open={mobileNav}

        storeName={
          storeSettings?.store_name ||
          "FriBolos"
        }

        onScreenChange={
          setScreen
        }

        onClose={() => {
          setMobileNav(false);
        }}

        onNewOrder={() => {
          setModal(true);
        }}
      />

      <section className="workspace">
        <AdminTopbar
          screen={screen}
          query={query}

          userName={
            profile?.full_name ||
            "Administrador"
          }

          unreadNotificationsCount={
            unreadNotificationsCount
          }

          onQueryChange={setQuery}

          onOpenMenu={() => {
            setMobileNav(true);
          }}

          onToggleNotifications={() => {
            setNotificationsOpen(
              currentValue =>
                !currentValue
            );
          }}

          onLogout={async () => {
            sessionStorage.removeItem(
              "fribolos-client-section"
            );

            setClientNavigationRequest(null);

            await handleLogout();
          }}
        />

        <AdminContent
          screen={screen}

          orders={appOrders}

          filteredOrders={
            filteredOrders
          }

          products={products}
          quotes={quotes}
          reviews={reviews}

          storeSettings={
            storeSettings
          }

          reviewsLoading={
            reviewsLoading
          }

          storeSettingsLoading={
            storeSettingsLoading
          }

          savingStoreSettings={
            savingStoreSettings
          }

          updatingOrderId={
            updatingOrderId
          }

          resolvingRequestId={
            resolvingRequestId
          }

          updatingQuoteId={
            updatingQuoteId
          }

          onScreenChange={
            setScreen
          }

          onOpenOrderModal={() => {
            setModal(true);
          }}

          onOrderStatusChange={
            handleOrderStatusChange
          }

          onResolveOrderRequest={
            resolveOrderRequest
          }

          onQuoteUpdate={
            handleAdminQuoteResponse
          }

          onProductsChange={
            setProducts
          }

          onStockChange={
            handleStockChange
          }

          onSaveSettings={
            saveStoreSettings
          }

          onToast={message => {
            setToast(message);

            window.setTimeout(() => {
              setToast("");
            }, 2800);
          }}
        />
      </section>

      {notificationsOpen && (
        <NotificationPanel
          items={notifications}
          loading={notificationsLoading}
          onClose={() =>
            setNotificationsOpen(false)
          }
          onRead={handleMarkNotificationsAsRead}
          onSelect={
            handleAdminNotificationSelect
          }
        />
      )}

      {modal && (
        <AdminOrderModal
          products={products}
          clients={orderClients}

          clientsLoading={
            orderClientsLoading
          }

          saving={savingOrder}

          deliveryFee={Number(
            storeSettings?.delivery_fee || 0
          )}

          fulfillmentType={
            adminFulfillmentType
          }

          setFulfillmentType={
            setAdminFulfillmentType
          }

          onSubmit={saveOrder}

          onClose={() => {
            setModal(false);
          }}
        />
      )}

      {toast && (
        <div className="toast">
          ✓ {toast}
        </div>
      )}
    </main>
  );
}
