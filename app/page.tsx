"use client";

import { useState } from "react";

import type {
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

export default function Home() {
  const [screen, setScreen] =
    useState<Screen>("Visão geral");

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
    return (
      <Login onLogin={handleLogin} />
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

          onLogout={handleLogout}
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
