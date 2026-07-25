"use client";

import type {
  Dispatch,
  FormEvent,
  SetStateAction,
} from "react";

import { AdminQuotes } from "./admin-quotes";
import { Catalog } from "./catalog";
import { Clients } from "./clients";
import { Dashboard } from "./dashboard";
import { Finance } from "./finance";
import { Inventory } from "./inventory";
import { Orders } from "./orders";
import { Production } from "./production";
import { Reports } from "./reports";
import { Settings } from "./settings";

import type {
  AppOrder,
  AppReview,
  Product,
  Quote,
  Screen,
  StoreSettings,
} from "../../types";

type AdminContentProps = {
  screen: Screen;

  orders: AppOrder[];
  filteredOrders: AppOrder[];

  products: Product[];
  quotes: Quote[];
  reviews: AppReview[];

  storeSettings:
    StoreSettings | null;

  reviewsLoading: boolean;
  storeSettingsLoading: boolean;
  savingStoreSettings: boolean;

  updatingOrderId:
    string | null;

  resolvingRequestId:
    string | null;

  updatingQuoteId:
    string | null;

  onScreenChange: (
    screen: Screen
  ) => void;

  onOpenOrderModal: () => void;

  onOrderStatusChange: (
    databaseId: string,
    status: string
  ) => Promise<void>;

  onResolveOrderRequest: (
    order: AppOrder,
    decision:
      | "approved"
      | "rejected"
  ) => Promise<void>;

  onQuoteUpdate: (
    quote: Quote,
    value: string,
    message: string
  ) => Promise<boolean>;

  onProductsChange: Dispatch<
    SetStateAction<Product[]>
  >;

  onStockChange: (
    productId: Product["id"],
    newStock: number
  ) => Promise<void>;

  onSaveSettings: (
    event:
      FormEvent<HTMLFormElement>
  ) => Promise<void>;

  onToast: (
    message: string
  ) => void;
};

export function AdminContent({
  screen,
  orders,
  filteredOrders,
  products,
  quotes,
  reviews,
  storeSettings,
  reviewsLoading,
  storeSettingsLoading,
  savingStoreSettings,
  updatingOrderId,
  resolvingRequestId,
  updatingQuoteId,
  onScreenChange,
  onOpenOrderModal,
  onOrderStatusChange,
  onResolveOrderRequest,
  onQuoteUpdate,
  onProductsChange,
  onStockChange,
  onSaveSettings,
  onToast,
}: AdminContentProps) {
  if (screen === "Visão geral") {
    return (
      <Dashboard
        setScreen={onScreenChange}
        openModal={onOpenOrderModal}
        orders={orders}
      />
    );
  }

  if (screen === "Pedidos") {
    return (
      <Orders
        orders={filteredOrders}
        openModal={onOpenOrderModal}
        onStatus={
          onOrderStatusChange
        }
        updatingOrderId={
          updatingOrderId
        }
        onResolveRequest={
          onResolveOrderRequest
        }
        resolvingRequestId={
          resolvingRequestId
        }
      />
    );
  }

  if (screen === "Orçamentos") {
    return (
      <AdminQuotes
        quotes={quotes}
        onUpdate={onQuoteUpdate}
        updatingQuoteId={
          updatingQuoteId
        }
      />
    );
  }

  if (screen === "Produção") {
    return (
      <Production
        orders={orders}
        onStatus={
          onOrderStatusChange
        }
        updatingOrderId={
          updatingOrderId
        }
      />
    );
  }

  if (screen === "Cardápio") {
    return (
      <Catalog
        products={products}
        onChange={
          onProductsChange
        }
        onToast={onToast}
      />
    );
  }

  if (screen === "Estoque") {
    return (
      <Inventory
        products={products.filter(
          product =>
            !product.archived
        )}
        onStock={onStockChange}
      />
    );
  }

  if (screen === "Clientes") {
    return (
      <Clients orders={orders} />
    );
  }

  if (screen === "Financeiro") {
    return <Finance />;
  }

  if (screen === "Relatórios") {
    return (
      <Reports
        reviews={reviews}
        orders={orders}
        loading={reviewsLoading}
      />
    );
  }

  if (
    screen === "Configurações"
  ) {
    return (
      <Settings
        settings={storeSettings}
        loading={
          storeSettingsLoading
        }
        saving={
          savingStoreSettings
        }
        onSave={onSaveSettings}
      />
    );
  }

  return null;
}